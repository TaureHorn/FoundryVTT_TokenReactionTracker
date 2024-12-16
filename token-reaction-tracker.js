
console.log(`Token Reaction Tracker ==> init`)

class TRT {

    static ID = 'token-reaction-tracker'

    static FLAGS = {
        REACTION_USED: 'reactionUsed',
        LINKED_TOKENS: 'linkedTokens'
    }

    static IMAGES = {
        BUTTON: `modules/${this.ID}/divert.svg`
    }

    static log(...args) {
        return console.log(this.ID, ' | ', ...args)
    }

    static error(...args) {
        return console.error(this.ID, ' | ', ...args)
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
        <div id="trt-hud-button" class="control-icon ${tokenReactionUsed ? 'active' : 'inactive'}" data-action="token-reaction-toggle" data-tooltip="${game.i18n.localize('TRT.toggle-state')}">
            <img src="${TRT.IMAGES.BUTTON}" />
        </div>`)

        // add button to ui and give it an jquery event listener
        html.find('div.right').last().append(button)
        button.click(() => TRT.onButtonClick())

    }

    static onButtonClick() {
        // get all controlled tokens and trigger reaction state change for them
        canvas.tokens.controlled.forEach(async (token) => {
            const tokenReactionUsed = this.getTokenFlag(token.document)
            this.setTokenReactionFlags(token.document, tokenReactionUsed)
        })
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

export default class TRT_Macros {

    constructor() {
        this._target = this.#validateTarget(Array.from(game.user.targets).map(token => token.document._id));
        this._selected = this.#validateSelected(canvas.tokens.controlled.map(token => token.document._id));
    }

    #validateSelected(selectedArr) {
        // if targetted token in selection remove from selectedArr
        if (selectedArr.includes(this._target)) {
            selectedArr.splice(selectedArr.indexOf(this._target), 1)
        }
        return this._selected = selectedArr
    }

    #validateTarget(targetArr) {
        // checks arr is has singular entry 
        if (targetArr.length === 0) return ui.notifications.warn(`${TRT.ID} | ${game.i18n.localize("TRT.warnings.no-target")}`)
        if (targetArr.length > 1) return ui.notifications.warn(`${TRT.ID} | ${game.i18n.localize("TRT.warnings.multi-target")}`)
        return this._target = targetArr[0]
    }


    get selected() {
        // checks if arr contains entries
        if (this._selected.length === 0) return ui.notifications.warn(`${TRT.ID} | ${game.i18n.localize("TRT.warnings.no-selected")}`)
        return this._selected
    }

    get target() {
        return this._target
    }

    get token() {
        const token = canvas.tokens.get(this.target)
        if (!token) {
            return ui.notifications.warn(`${TRT.ID} | ${game.i18n.localize("TRT.warnings.no-token")}`)
        }
        return token
    }

    get tokenDoc() {
        if (!this.token) return
        return this.token.document
    }

    controlLinked() {
        if (this.#handleSetupErrors(false)) return

        // if no linked tokens release control of token
        if (this.getLinked().length === 0) {
            canvas.tokens.controlled.forEach(token => token.release())
            ui.notifications.info(`${TRT.ID} | ${game.i18n.localize("TRT.notifications.zero-linked")}`)
        } else {
            // if linked tokens iterate through array, get tokens and control them
            this.getLinked().forEach((id, index) => {
                const token = canvas.tokens.get(id) ? canvas.tokens.get(id) : false
                if (!token) return
                const releaseOthers = index === 0 ? true : false
                token.control({'releaseOthers': releaseOthers})
            })
        }
    }

    getLinked() {
        // @return {Object} --> this.tokens linkedTokens flag
        if (!this.token || !this.tokenDoc) return
        const linkedTokens = this.tokenDoc.getFlag(TRT.ID, TRT.FLAGS.LINKED_TOKENS)
        return linkedTokens ? linkedTokens : []
    }

    #handleSetupErrors(requireSelection) {
        // @param {Boolena} requireSelection --> operation mode of checking input requirements. true = check for selection & target, false = check for target
        if (requireSelection) {
            if (typeof this.target !== 'string' || typeof this.selected !== 'object') return true
        } else {
            if (typeof this.target !== 'string') return true
        }
    }

    async linkTokens() {
        if (this.#handleSetupErrors(true)) return

        // get flags and add selected tokens ids
        let flags = [...this.getLinked()]
        this.selected.forEach(id => {
            if (!flags.includes(id)) flags.push(id)
        })

        // update flags
        await this.tokenDoc.setFlag(TRT.ID, TRT.FLAGS.LINKED_TOKENS, flags)
        return ui.notifications.info(`${TRT.ID} | ${game.i18n.localize("TRT.notifications.link-success")}`)
    }

    async logLinked() {
        if (this.#handleSetupErrors(false)) return

        // return {Object} --> returns class data   
        TRT.log({ linked: this.getLinked(), target: this.target })
    }

    async unlinkAllTokens() {
        if (this.#handleSetupErrors(false)) return

        // remove linkedTokens flag from target
        await this.tokenDoc.unsetFlag(TRT.ID, TRT.FLAGS.LINKED_TOKENS)
        return ui.notifications.info(`${TRT.ID} | ${game.i18n.localize("TRT.notifications.unlink-all")}`)
    }

    async unlinkTokens() {
        if (this.#handleSetupErrors(true)) return
        
        // get target flags for linked tokens and remove selected from linked tokens array
        let flags = [...this.getLinked()]
        flags = flags.filter(id => !this.selected.includes(id))

        // update target linked tokens flags based on filter removal of selected ids
        await this.tokenDoc.setFlag(TRT.ID, TRT.FLAGS.LINKED_TOKENS, flags)
        return ui.notifications.info(`${TRT.ID} | ${game.i18n.localize("TRT.notifications.unlink-success")}`)
    }

}

globalThis.TRT_Macros = TRT_Macros

Hooks.on('init', function() {

    // only enables functionality when in combat
    game.settings.register(TRT.ID, 'enableOnlyInCombat', {
        name: game.i18n.localize("TRT.settings.combat-only"),
        hint: game.i18n.localize("TRT.settings.combat-only_desc"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: false,
        restricted: true
    })

    // disables functionality to set token reactions to unused at the start of their turn in combat
    game.settings.register(TRT.ID, 'disableAutoRefresh', {
        name: game.i18n.localize("TRT.settings.disable-autorefresh"),
        hint: game.i18n.localize("TRT.settings.disable-autorefresh_desc"),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: false,
        restricted: true
    })

    // disables scrolling text triggered on token reaction state change
    game.settings.register(TRT.ID, 'disableScrollingText', {
        name: game.i18n.localize("TRT.settings.disable-scrolltext"),
        hint: game.i18n.localize("TRT.settings.disable-scrolltext_desc"),
        scope: 'client',
        config: true,
        type: Boolean,
        default: false,
        requiresReload: false
    })

    // toggles token reaction state toggle on hovered tokens when token selection tools used
    game.keybindings.register(TRT.ID, 'toggleTokenState', {
        name: game.i18n.localize("TRT.settings.toggle-token"),
        hint: game.i18n.localize("TRT.settings.toggle-token_desc"),
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
    // if auto refresh is disabled in settings do not trigger the state change
    if (game.settings.get(TRT.ID, 'disableAutoRefresh')) return

    let toUpdateArr = [toCombatant.tokenId]
    const token = canvas.tokens.get(toCombatant.tokenId) ? canvas.tokens.get(toCombatant.tokenId).document : false
    if (!token) return

    // if toCombatant has linkedTokens in flags add linkedTokens ids to toUpdateArr
    if (token.getFlag(TRT.ID, TRT.FLAGS.LINKED_TOKENS)) {
        toUpdateArr = toUpdateArr.concat(token.getFlag(TRT.ID, TRT.FLAGS.LINKED_TOKENS))
    }

    // iterate through tokens to conditionally update them
    toUpdateArr.forEach(async (id) => {
        const token = canvas.tokens.get(id) ? canvas.tokens.get(id).document : false
        if (!token || !token.isOwner) return 

        // bypass tokens with unused reactions
        if (!TRT.getTokenFlag(token)) return

        // bypass tokens that represent dead creatures
        if (token.actor.effects._source.map(effect => effect.name === "Dead").includes(true)) return

        const tokenReactionUsed = true
        await TRT.setTokenReactionFlags(token, tokenReactionUsed)
    })

})

