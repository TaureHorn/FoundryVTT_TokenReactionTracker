
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

    static prepHUD(hud, html, tokenExtra) {
        // @param {Object} hud
        // @param {HTML Collection} html 
        // @param {Object} tokenExtra
        
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
        // inverse the boolean to toggle state
        const bool = tokenReactionUseState ? false : true
        this.setTokenReactionFlags(token, bool)
    }

    static async setTokenReactionFlags(token, bool) {
        // @param {Object} token --> the token to set flags on
        // @param {Boolean} bool --> whether or not the reaction has been used
        this.log('setTokenReactionFlags $TOKEN', token, 'canvas-token', canvas.tokens.controlled[0])
        await token.setFlag(this.ID, this.FLAGS.REACTION_USED, bool)
    }
}

Hooks.on('renderTokenHUD', (hud, html, token) => {
    TRT.prepHUD(hud, html, token)
})

