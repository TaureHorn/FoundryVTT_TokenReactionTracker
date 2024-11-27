
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
        // if not currently using token tool return
        if (!canvas.tokens.active || !canvas.tokens.hover) return
        const token = canvas.tokens.hover.document
        const tokenReactionUseState = token.getFlag(TRT.ID, TRT.FLAGS.REACTION_USED) ? true : false
        this.setTokenReactionFlags(token, tokenReactionUseState)
    }

    static prepHUD(hud, html, tokenExtra) {
        // @param {Object} hud
        // @param {HTML Collection} html 
        // @param {Object} tokenExtra

        if (game.settings.get(TRT.ID, 'enableOnlyInCombat') && !game.combat) {
            return
        }

        // token data from renderTokenHUD includes more data than comes in a Token class
        //      therefore cannot be used to interact with flags 
        //      so we need to get the token from the canvas
        const canvasToken = canvas.tokens.getDocuments().find(token => token._id === tokenExtra._id)
        if (!canvasToken) return ui.notifications.warn(`${TRT.ID} | Couldn't find a token with the appropriate ID`)

        // set tokenReactionUseState based on flags.
        // unset flags return undefined which is apparently falsy and will therefore turn false in the ternary
        let tokenReactionUseState = canvasToken.getFlag(TRT.ID, TRT.FLAGS.REACTION_USED) ? true : false

        // assemble a button
        const button = $(`
        <div class="control-icon ${tokenReactionUseState ? 'active' : 'inactive'}" data-action="token-reaction-toggle" data-tooltip="${game.i18n.localize(tokenReactionUseState ? 'used-reaction' : 'unused-reaction')}">
            <img src="${TRT.IMAGES.BUTTON}" />
        </div>
        `)

        // add button to ui and give it an jquery event listener
        html.find('div.right').last().append(button)
        button.click((event) => TRT.onButtonClick(event, hud, canvasToken, tokenReactionUseState))

    }

    static onButtonClick(event, hud, token, tokenReactionUseState) {
        this.setTokenReactionFlags(token, tokenReactionUseState)
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

        // calculate center position based on token size and grid size
        const position = {
            x: token.x + ((canvas.grid.size * token.width) * 0.5),
            y: token.y + ((canvas.grid.size * token.height) * 0.5)
        }
        const message = `${state ? '-' : '+'} reaction`
        const direction = state ? 1 : 2 // dictates which direction the text scrolls. 2 = up, 1 = down

        await canvas.interface.createScrollingText(position, message, {direction: direction})
    }

}

Hooks.on('init', function() {

    game.settings.register(TRT.ID, 'enableOnlyInCombat', {
        name: "Enable in combat only",
        hint: 'The reaction tracker button will only show on the token HUD when there is an active combat encounter',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: false
    })

    game.keybindings.register(TRT.ID, 'launchManager', {
        name: "Toggle token reaction state",
        hint: "Toggles the reaction use state on a moused-over token",
        editable: [
            {
                key: "KeyR",
            }
        ],
        onDown: () => {
            TRT.getTarget()
        }
    })

})

Hooks.on('renderTokenHUD', (hud, html, token) => {
    TRT.prepHUD(hud, html, token)
})

