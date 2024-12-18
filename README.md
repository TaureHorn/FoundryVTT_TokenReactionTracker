# Token Reaction Tracker
### Track token combat reaction usage on the Token HUD
![TOKEN HUD](https://github.com/TaureHorn/FoundryVTT_TokenReactionTracker/raw/main/screenshot.png)

Designed with DnD5e in mind where a creature gets one reaction per round of combat. Sometimes it is difficult to remember and keep track of which creatures have used their reactions. This module will allow you to manually track which tokens have used their reactions.

Additionally when in combat, tokens that have used their reaction will have refreshed at the start of their turn. This will only apply to the token linked to the combat encounter and not to all tokens if you run things by using multiple creatures on the same initiative.

While this is designed with DnD5e in mind, it does not at present integrate with the character sheets. This also means this module is system agnostic if you can find the need in another system for this mechanic.
## Macros
If you prefer to run combat with multiple tokens/actors occupying the same spot in the initiative order, this modules ordinary reaction reset on turn start will not function as intended. Foundry only keeps track of the token that is actually tied to the initiative.

To bpyass this issue there are a few macros you can use to link all the non-combat enabled tokens to the token actually in the initiative. To use these macros, you need to target the combatants token (the one that is tracked in the initiative). You also need to select all the tokens you want to link to this combatant. Once tokens and targeted and selected, activate a macro.
![Macro selection scenario](https://github.com/TaureHorn/FoundryVTT_TokenReactionTracker/raw/main/macro_use.png)
### Link Tokens
Use the following macro to link tokens to the combatant.
```
const tracker = new TRT_Macros()
await tracker.linkTokens()
```
### Unlink Tokens
Use the following macro to unlink the selected tokens from the combatant.
```
const tracker = new TRT_Macros()
await tracker.unlinkTokens()
```
### Unlink All Tokens
Use the following macro to unlink ALL tokens from the combatant. Does not require you to have any tokens selected, just the target token targeted.
```
const tracker = new TRT_Macros()
await tracker.unlinkAllTokens()
```
### Control Linked Tokens
Use to following macro to control a targeted token's linked tokens. Does not require you to have any tokens selected, just the target token targeted.
```
const tracker = new TRT_Macros()
tracker.controlLinked()
```
### Log Linked
Use the following to output the target tokenId and its linkedTokens (if any) tokenIds to the browser console. Does not require you to have any tokens selected, just the target token targeted.
```
const tracker = new TRT_Macros()
tracker.logLinked()
```
## Settings
### GM only
- Enable in combat only: Only shows the reaction tracker button on the token HUD when in combat
- Disable auto refresh: Disables the effect that auto refreshes a tokens reaction on the HUD marker when they start their turn in combat
### GM & Players
- Disable scrolling text: Disables token scrolling text that displays when a tokens reaction state changes.
## Sources
`divert.svg` https://game-icons.net/1x1/lorc/divert.html
