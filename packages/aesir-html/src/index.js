import globalCss from '@aesir/css/aesir-global.css?inline';
import motionCss from '@aesir/css/aesir-motion.css?inline';
import { registerIcons } from './icons/registry.js';
import { toast } from '@aesir/svelte/components/aesir-toast';
import './elements/aesir-alert.svelte';
import './elements/aesir-annotation.svelte';
import './elements/aesir-accordion.svelte';
import './elements/aesir-animate.svelte';
import './elements/aesir-avatar.svelte';
import './elements/aesir-badge.svelte';
import './elements/aesir-breadcrumb.svelte';
import './elements/aesir-button.svelte';
import './elements/aesir-button-group.svelte';
import './elements/aesir-card.svelte';
import './elements/aesir-checkbox.svelte';
import './elements/aesir-code-window.svelte';
import './elements/aesir-snippet.svelte';
import './elements/aesir-collapsible.svelte';
import './elements/aesir-component-preview.svelte';
import './elements/aesir-command-menu.svelte';
import './elements/aesir-autocomplete-box.svelte';
import './elements/aesir-context-menu.svelte';
import './elements/aesir-date-picker.svelte';
import './elements/aesir-dialog.svelte';
import './elements/aesir-drawer.svelte';
import './elements/aesir-dropdown.svelte';
import './elements/aesir-file-upload.svelte';
import './elements/aesir-field.svelte';
import './elements/aesir-footer.svelte';
import './elements/aesir-icon.svelte';
import './elements/aesir-icon-swap.svelte';
import './elements/aesir-input.svelte';
import './elements/aesir-kbd.svelte';
import './elements/aesir-loader.svelte';
import './elements/aesir-menubar.svelte';
import './elements/aesir-navbar.svelte';
import './elements/aesir-native-select.svelte';
import './elements/aesir-pill.svelte';
import './elements/aesir-popover.svelte';
import './elements/aesir-portal.svelte';
import './elements/aesir-progress.svelte';
import './elements/aesir-skeleton.svelte';
import './elements/aesir-empty-state.svelte';
import './elements/aesir-pagination.svelte';
import './elements/aesir-separator.svelte';
import './elements/aesir-tree-view.svelte';
import './elements/aesir-resizable-panels.svelte';
import './elements/aesir-stepper.svelte';
import './elements/aesir-tag-input.svelte';
import './elements/aesir-date-range-picker.svelte';
import './elements/aesir-quantity-stepper.svelte';
import './elements/aesir-radio.svelte';
import './elements/aesir-scroll-area.svelte';
import './elements/aesir-sidebar.svelte';
import './elements/aesir-selection-toolbar.svelte';
import './elements/aesir-slider.svelte';
import './elements/aesir-status-bar.svelte';
import './elements/aesir-switch.svelte';
import './elements/aesir-table.svelte';
import './elements/aesir-textarea.svelte';
import './elements/aesir-tabs.svelte';
import './elements/aesir-toggle.svelte';
import './elements/aesir-toggle-group.svelte';
import './elements/aesir-toaster.svelte';
import './elements/aesir-tooltip.svelte';

const styleId = 'aesir-html-styles';
const elementBaseCss = `
:root {
	--aesir-overlay-z-popover: 50;
	--aesir-overlay-z-dialog: 70;
	--aesir-overlay-z-tooltip: 80;
	--aesir-overlay-z-toast: 90;
}

aesir-alert,
aesir-annotation,
aesir-accordion,
aesir-animate,
aesir-avatar,
aesir-badge,
aesir-breadcrumb,
aesir-button,
aesir-button-group,
aesir-card,
aesir-checkbox,
aesir-code-window,
aesir-snippet,
aesir-collapsible,
aesir-component-preview,
aesir-command-menu,
aesir-autocomplete-box,
aesir-context-menu,
aesir-date-picker,
aesir-dialog,
aesir-drawer,
aesir-dropdown,
aesir-file-upload,
aesir-field,
aesir-footer,
aesir-icon,
aesir-icon-swap,
aesir-input,
aesir-kbd,
aesir-loader,
aesir-menubar,
aesir-navbar,
aesir-native-select,
aesir-pill,
aesir-popover,
aesir-portal,
aesir-progress,
aesir-skeleton,
aesir-empty-state,
aesir-pagination,
aesir-separator,
aesir-tree-view,
aesir-resizable-panels,
aesir-stepper,
aesir-tag-input,
aesir-date-range-picker,
aesir-quantity-stepper,
aesir-radio,
aesir-scroll-area,
aesir-sidebar,
aesir-selection-toolbar,
aesir-slider,
aesir-status-bar,
aesir-switch,
aesir-table,
aesir-textarea,
aesir-tabs,
aesir-toggle,
aesir-toggle-group,
aesir-toaster,
aesir-tooltip {
	font-family: var(--ds-font-family-sans);
	letter-spacing: var(--ds-font-letter-spacing-normal);
}

aesir-alert,
aesir-annotation,
aesir-accordion,
aesir-animate,
aesir-breadcrumb,
aesir-card,
aesir-code-window,
aesir-snippet,
aesir-collapsible,
aesir-component-preview,
aesir-command-menu,
aesir-autocomplete-box,
aesir-context-menu,
aesir-date-picker,
aesir-dialog,
aesir-drawer,
aesir-file-upload,
aesir-field,
aesir-footer,
aesir-input,
aesir-menubar,
aesir-navbar,
aesir-native-select,
aesir-progress,
aesir-empty-state,
aesir-pagination,
aesir-tree-view,
aesir-resizable-panels,
aesir-stepper,
aesir-tag-input,
aesir-date-range-picker,
aesir-scroll-area,
aesir-sidebar,
aesir-selection-toolbar,
aesir-slider,
aesir-status-bar,
aesir-table,
aesir-textarea,
aesir-tabs,
aesir-toggle-group,
aesir-toaster {
	display: block;
}

aesir-scroll-area {
	overflow: hidden;
}

aesir-avatar,
aesir-badge,
aesir-button,
aesir-button-group,
aesir-checkbox,
aesir-dropdown,
aesir-icon,
aesir-icon-swap,
aesir-kbd,
aesir-pill,
aesir-popover,
aesir-quantity-stepper,
aesir-radio,
aesir-switch,
aesir-toggle,
aesir-tooltip {
	display: inline-block;
}

aesir-portal {
	display: contents;
}

aesir-dropdown,
aesir-popover,
aesir-tooltip,
aesir-dialog,
aesir-drawer,
aesir-command-menu,
aesir-context-menu,
aesir-autocomplete-box,
aesir-date-picker,
aesir-menubar,
aesir-toaster {
	position: relative;
}

aesir-dropdown,
aesir-popover {
	z-index: var(--aesir-overlay-z-popover);
}

aesir-tooltip {
	z-index: var(--aesir-overlay-z-tooltip);
}

aesir-dialog[open],
aesir-drawer[open],
aesir-command-menu[open] {
	z-index: var(--aesir-overlay-z-dialog);
}

aesir-toaster {
	z-index: var(--aesir-overlay-z-toast);
}
`;

export function registerAesirElements() {
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `${globalCss}\n${motionCss}\n${elementBaseCss}`;
    document.head.append(style);
  }
  document.documentElement.classList.add('aesir-html-ready');
}

registerAesirElements();

globalThis.Aesir = Object.assign(globalThis.Aesir ?? {}, {
  register: registerAesirElements,
  registerIcons,
  toast,
  version: __AESIR_VERSION__
});
