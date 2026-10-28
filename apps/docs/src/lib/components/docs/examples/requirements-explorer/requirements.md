---
variants:
  - component-density--compact
  - component-density--comfortable
  - documentation--included
  - documentation--excluded
---

# SoWs & Requirements

The component library is maintained as an R&D SoW. Requirements are stored directly in this Markdown file and linked to implementation issues.

The current milestone covers token architecture, form controls, and documentation. Earlier overlay work remains in Q2, while ideas without confirmed scope stay in the backlog.

## Current milestone

|Q3| (wip) {Q3} {? Scope is reviewed during the weekly library maintenance sync. ?} Current component-library milestone [0.688PW] #106301
|Q3.FOUNDATIONS| (wip) {Token architecture} Consolidate semantic tokens and theme contracts [0.125PW] #103598 #104740 #101989 #105838 <component-density--compact>
|Q3.COMPONENTS| (wip) {Form controls} Complete the accessible form-control set [0PW] #105076 #100899 #100516
|Q3.DOCS| (none) {Documentation refresh} Refresh examples and component API pages [0.563PW] #103907 <documentation--included>

## Previous milestone

|Q2| (wip) {Q2} {! This group contains carry-over work. Confirm ownership before moving unresolved requirements. !} Previous component-library milestone [4.888PW] #106188
|Q2.OVERLAYS| (wip) {Overlay primitives} Standardize dialogs, popovers, menus, and tooltips. [Interaction spec](#overlay-spec) [0.175PW] #97314 #101806 #101563
|Q2.OVERLAYS.1| (wip) {Popover positioning} Share collision and placement behavior across overlays. [Positioning proposal](#positioning-proposal) [Interaction spec](#interaction-spec) [Accessibility notes](#accessibility-notes) [0.175PW] #101855
|Q2.OVERLAYS.1.1| (unknown) {Nested menu navigation} Preserve pointer intent across nested menu levels. [Navigation model](#nested-navigation) [0.063PW] #105901 #105902
|Q2.OVERLAYS.2| (unknown) {Focus management} Restore focus consistently after overlays close [0PW] #103509 #104132
|Q2.TABLE| (wip) {Data table} Add compact sorting and selection patterns [0.738PW] #103055 #103961
|Q2.EDITOR| (done) {Rich text editor} Improve structured editing primitives [0.375PW] #103070 #101494
|Q2.MIGRATION| (done) {Migration guide} Document upgrade paths and breaking changes [0PW] #97973
|Q2.A11Y_REFACTOR| (wip) {Accessibility refactor} {! Coordinate this migration with overlay work before removing legacy focus utilities. !} Remove duplicated interaction and announcement logic [2.213PW] #94106 #98623
|Q2.SEARCH| (wip) {Documentation search} Improve search across component API pages [0.113PW] #103471 #103024 #103334
|Q2.PLAYGROUND| (unknown) {Interactive playground} Add editable examples for common component states [0.1PW] #96752 #103916
|Q2.PERFORMANCE| (done) {Bundle performance} Avoid loading unused component code [0PW] #96663 #98565
|Q2.ENHANCEMENTS| (unknown) {Component enhancements} Small API and interaction improvements [0PW] #100391 #90655 #90641
|Q2.BUGS| (problem) {Component bugs} Cross-component bug-fix batch [0.35PW] #101580 #101337 #91243
|Q2.ERRORS| (unknown) {Validation messages} Surface actionable form errors [0PW] #98671
|Q2.SCAFFOLD| (done) {Component scaffolding} Create a guided component contribution flow [0PW] #99038
|Q2.THEMES| (wip) {Theme presets} Improve theme authoring and previews [0.813PW] #97739 #98242
|Q2.CONFIGURATION| (done) {Configuration API} Enable reusable provider configuration [0.1PW] #98037

Q2.OVERLAYS.2: Focus restoration must work across Svelte and Custom Element consumers.

## Unscheduled work

|Backlog| (none) {Backlog} Unscheduled library work [0.1PW]
|Backlog.COMPONENTS| (unknown) {Component backlog} Ideas awaiting prioritization [0.1PW] #90604 #73872 #90983

## Completed milestone

|Q1| (done) {Q1} Completed component-library milestone [1.363PW] #91201
|Q1.BUTTONS| (done) {Button primitives} Core button interactions and variants [0.138PW] #91484 #84963 #88005
|Q1.FORMS| (done) {Form foundations} Shared labels, descriptions, and validation [0.525PW] #87720 #92212 #92215
|Q1.REFACTORS| (done) {Refactors} Maintenance refactors and cleanups [0.15PW] #90574 #91505 #90744
|Q1.QUALITY| (done) {Quality of life} General contributor-experience improvements [0.55PW] #91209 #91929 #91930
