
console.log(`Token Reaction Tracker ==> init`)

class TRT {

    static ID = 'token-reaction-tracker'

    static FLAGS = {
        REACTION_USED: 'reactionUsed'
    }

    static IMAGES = {
        BUTTON: `modules/${this.ID}/divert.svg`
    }

    static log(...args) {
        return console.log(this.ID, ' | ', ...args)
    }

    static getTarget() {
        // @return {Object} target
        const token = canvas.tokens.hover.document
        const target = {
            token: token,
            state: this.getTokenFlag(token),
        }
        return target
    }

    static getTokenFlag(token) {
        // @param {Object} token
        // @return {Boolean}
        return token.getFlag(TRT.ID, TRT.FLAGS.REACTION_USED) ? true : false
    }

    static prepHUD(hud, html, tokenExtra) {
        // @param {Object} hud
        // @param {HTML Collection} html 
        // @param {Object} tokenExtra

        // if not in combat and setting disabled out of combat return
        if (game.settings.get(TRT.ID, 'enableOnlyInCombat') && !game.combat) return

        // token data from renderTokenHUD includes more data than comes in a Token class
        //      therefore cannot be used to interact with flags 
        //      so we need to get the token from the canvas
        const token = canvas.tokens.getDocuments().find(token => token._id === tokenExtra._id)
        if (!token) return ui.notifications.warn(`${TRT.ID} | Couldn't find a token with the appropriate ID`)

        // set tokenReactionUsed based on flags.
        // unset flags return undefined which is apparently falsy and will therefore turn false in the ternary
        const tokenReactionUsed = this.getTokenFlag(token)

        // assemble a button
        const button = $(`
        <div id="trt-hud-button" class="control-icon ${tokenReactionUsed ? 'active' : 'inactive'}" data-action="token-reaction-toggle" data-tooltip="${game.i18n.localize(tokenReactionUsed ? 'used-reaction' : 'unused-reaction')}">
            <img src="${TRT.IMAGES.BUTTON}" />
        </div>`)

        // add button to ui and give it an jquery event listener
        html.find('div.right').last().append(button)
        button.click((event) => TRT.onButtonClick(event, hud, token, tokenReactionUsed))

    }

    static onButtonClick(event, hud, token, tokenReactionUsed) {
        // @param {Object} token
        // @param {Boolean} tokenReactionUsed
        this.setTokenReactionFlags(token, tokenReactionUsed)
    }

    static async setTokenReactionFlags(token, state) {
        // @param {Object} token --> the token to set flags on
        // @param {Boolean} bool --> whether or not the reaction has been used

        // inverse the boolean to toggle state
        const bool = state ? false : true
        await token.setFlag(this.ID, this.FLAGS.REACTION_USED, bool)
        this.spawnScrollingText(token, bool)
    }

    static async spawnScrollingText(token, state) {
        // @param {Object} token
        // @param {Boolean} state -> state of reaction on flags AFTER is is set by this.setTokenReactionFlags

        if (game.settings.get(TRT.ID, 'disableScrollingText')) return

        // calculate center position based on token size and grid size
        const position = {
            x: token.x + ((canvas.grid.size * token.width) * 0.5),
            y: token.y + ((canvas.grid.size * token.height) * 0.5)
        }
        const message = `${state ? '-' : '+'} reaction`
        const direction = state ? 1 : 2 // dictates which direction the text scrolls. 2 = up, 1 = down

        await canvas.interface.createScrollingText(position, message, { direction: direction })
    }

}

Hooks.on('init', function() {

    // only enables functionality when in combat
    game.settings.register(TRT.ID, 'enableOnlyInCombat', {
        name: game.i18n.localize("settings.combat-only"),
        hint: game.i18n.localize("settings.combat-only_desc"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: false,
        restricted: true
    })

    // disables functionality to set token reactions to unused at the start of their turn in combat
    game.settings.register(TRT.ID, 'disableAutoRefresh', {
        name: game.i18n.localize("settings.disable-autorefresh"),
        hint: game.i18n.localize("settings.disable-autorefresh_desc"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: false,
        restricted: true
    })

    // disables scrolling text triggered on token reaction state change
    game.settings.register(TRT.ID, 'disableScrollingText', {
        name: game.i18n.localize("settings.disable-scrolltext"),
        hint: game.i18n.localize("settings.disable-scrolltext_desc"),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: false
    })

    // toggles token reaction state toggle on hovered tokens when token selection tools used
    game.keybindings.register(TRT.ID, 'toggleTokenState', {
        name: game.i18n.localize("settings.toggle-token"),
        hint: game.i18n.localize("settings.toggle-token_desc"),
        editable: [
            {
                key: "KeyR",
            }
        ],
        onDown: () => {
            // if not currently using token tool return
            if (!canvas.tokens.active || !canvas.tokens.hover) return

            // if not in combat and setting disabled out of combat return
            if (game.settings.get(TRT.ID, 'enableOnlyInCombat') && !game.combat) return

            const target = TRT.getTarget()
            TRT.setTokenReactionFlags(target.token, target.state)
        }
    })

})

Hooks.on('renderTokenHUD', (hud, html, token) => {
    TRT.prepHUD(hud, html, token)
})


Hooks.on('combatTurnChange', async (combat, fromCombatant, toCombatant) => {
    const token = canvas.tokens.get(toCombatant.tokenId).document

    // if auto refresh is disabled in settings, or the token hasn't already used a reaction do not trigger the state change
    if (game.settings.get(TRT.ID, 'disableAutoRefresh') || !TRT.getTokenFlag(token)) return

    const tokenReactionUsed = true
    await TRT.setTokenReactionFlags(token, tokenReactionUsed)
})

