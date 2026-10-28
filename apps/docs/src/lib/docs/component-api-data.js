const props = (rows, note) => ({ title: 'Props', rows, note });
const row = (name, type, defaultValue, description, flags = []) => {
  const resolvedFlags = flags.length || !description.startsWith('Bindable') ? flags : ['bindable'];
  return {
    name: resolvedFlags.length ? { value: name, badges: resolvedFlags.map((label) => ({ label, tone: label })) } : name,
    type,
    default: defaultValue,
    description
  };
};

const kebabCase = (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const htmlRow = (entry) => {
  const sourceName = typeof entry.name === 'string' ? entry.name : entry.name.value;
  const snippet = entry.type.startsWith('Snippet');
  const event = sourceName.startsWith('on') && entry.type.includes('=>');
  const value = sourceName === 'children' ? 'default slot' : snippet ? `${kebabCase(sourceName)} slot` : event ? kebabCase(sourceName.slice(2)) : kebabCase(sourceName);
  const badges = typeof entry.name === 'string' ? [] : entry.name.badges.filter((badge) => badge.label !== 'bindable');

  return {
    ...entry,
    name: badges.length ? { value, badges } : value,
    type: snippet ? 'slot' : event ? 'CustomEvent' : entry.type,
    description: entry.description.replace(/^Bindable /, 'Current ')
  };
};

const htmlGroups = (groups) => groups.map((group) => ({ ...group, rows: group.rows.map(htmlRow) }));

export const componentApiForPlatform = (route, platform) => {
  const api = componentApiByRoute[route] ?? [];
  if (!Array.isArray(api)) return api[platform] ?? [];
  return platform === 'html' ? htmlGroups(api) : api;
};

export const componentApiByRoute = {
  '/docs/components/alert-dialog/': {
    svelte: [
      props([
        row('open', 'boolean', 'false', 'Bindable dialog visibility.', ['bindable']),
        row('title', 'string', 'required', 'Accessible dialog title.', ['required']),
        row('description', 'string', 'required', 'Supporting dialog description.', ['required']),
        row('confirmLabel', 'string', "'Continue'", 'Confirm button text.'),
        row('cancelLabel', 'string', "'Cancel'", 'Cancel button text.'),
        row('destructive', 'boolean', 'false', 'Uses the destructive confirm-button treatment.'),
        row('errorText', 'string', "'Action failed. Try again.'", 'Message shown when onconfirm rejects.'),
        row('children', 'Snippet', '-', 'Optional dialog content.'),
        row('onconfirm', '() => void | Promise<void>', '-', 'Runs on confirmation; the dialog stays open while the promise is pending and shows errorText if it rejects.'),
        row('oncancel', '() => void', '-', 'Runs when Cancel is pressed.')
      ])
    ]
  },
  '/docs/components/hover-card/': {
    svelte: [
      props(
        [
          row('trigger', 'Snippet<[TriggerProps]>', 'required', 'Focusable trigger; spread the supplied pointer, focus, click, and ARIA props onto it.', ['required']),
          row('content', 'Snippet', 'required', 'Interactive preview content.', ['required']),
          row('open', 'boolean', 'false', 'Bindable card visibility.', ['bindable']),
          row('disabled', 'boolean', 'false', 'Prevents the card from opening.'),
          row('label', 'string', "'Preview'", 'Accessible card label.'),
          row('openDelay', 'number', '500', 'Delay before opening on hover or focus, in milliseconds.'),
          row('closeDelay', 'number', '250', 'Delay before closing after the pointer or focus leaves, in milliseconds.'),
          row('placement', "'top' | 'bottom'", "'bottom'", 'Preferred side of the trigger.'),
          row('class', 'string', "''", 'Additional class on the trigger anchor.'),
          row('contentClass', 'string', "''", 'Additional class on the card content.')
        ],
        'Additional span attributes are forwarded to the trigger anchor.'
      )
    ]
  },
  '/docs/components/segmented-fields/': {
    svelte: [
      {
        title: 'AesirSegmentedField',
        rows: [
          row('kind', "'date' | 'time'", 'required', 'Selects date or time segments.', ['required']),
          row('label', 'string', 'required', 'Visible field label.', ['required']),
          row('name', 'string', '-', 'Form field name.'),
          row('value', 'string', "''", 'Bindable ISO date or 24-hour time value.', ['bindable']),
          row('disabled', 'boolean', 'false', 'Disables segment editing.'),
          row('required', 'boolean', 'false', 'Requires a complete value for form validation.'),
          row('readonly', 'boolean', 'false', 'Prevents editing while leaving the value readable.'),
          row('locale', 'string', "'en-US'", 'Controls date segment order and separators.'),
          row('min', 'string', '-', 'Earliest accepted date or time.'),
          row('max', 'string', '-', 'Latest accepted date or time.'),
          row('description', 'string', '-', 'Supporting text below the field.'),
          row('onchange', '(value: string) => void', '-', 'Runs after the committed value changes.')
        ]
      },
      {
        title: 'AesirDateField / AesirTimeField',
        rows: [
          row('label', 'string', 'required', 'Visible field label.', ['required']),
          row('name', 'string', '-', 'Form field name.'),
          row('value', 'string', "''", 'Bindable ISO date or 24-hour time value.', ['bindable']),
          row('disabled', 'boolean', 'false', 'Disables segment editing.'),
          row('required', 'boolean', 'false', 'Requires a complete value for form validation.'),
          row('readonly', 'boolean', 'false', 'Prevents editing while leaving the value readable.'),
          row('locale', 'string', "'en-US'", 'Controls date segment order and separators.'),
          row('min', 'string', '-', 'Earliest accepted date or time.'),
          row('max', 'string', '-', 'Latest accepted date or time.'),
          row('description', 'string', '-', 'Supporting text below the field.'),
          row('onchange', '(value: string) => void', '-', 'Runs after the committed value changes.')
        ],
        note: 'These wrappers set kind to date or time and forward the remaining props to AesirSegmentedField.'
      },
      {
        title: 'AesirDateRangeField / AesirTimeRangeField',
        rows: [
          row('label', 'string', 'required', 'Group legend.', ['required']),
          row('name', 'string', '-', 'Base form name; endpoints submit as name.start and name.end.'),
          row('value', '{ start: string; end: string }', "{ start: '', end: '' }", 'Bindable start and end values.', ['bindable']),
          row('disabled', 'boolean', 'false', 'Disables both fields.'),
          row('required', 'boolean', 'false', 'Requires both endpoints.'),
          row('readonly', 'boolean', 'false', 'Prevents editing of both endpoints.'),
          row('locale', 'string', "'en-US'", 'Locale applied to both fields.'),
          row('min', 'string', '-', 'Earliest allowed endpoint.'),
          row('max', 'string', '-', 'Latest allowed endpoint.')
        ],
        note: 'These wrappers set kind to date or time and constrain each endpoint against the other.'
      }
    ]
  },
  '/docs/components/select/': {
    svelte: [
      props(
        [
          row('label', 'string', 'required', 'Visible field label.', ['required']),
          row('name', 'string', '-', 'Form field name.'),
          row('options', '(Option | Group)[]', 'required', 'Options or labeled groups; options have value, label, and optional disabled.', ['required']),
          row('value', 'string', "''", 'Bindable value in single-select mode.', ['bindable']),
          row('values', 'string[]', '[]', 'Bindable values in multiple-select mode.', ['bindable']),
          row('multiple', 'boolean', 'false', 'Allows selecting more than one option.'),
          row('open', 'boolean', 'false', 'Bindable listbox visibility.', ['bindable']),
          row('required', 'boolean', 'false', 'Enables form validation.'),
          row('disabled', 'boolean', 'false', 'Disables the trigger and selection.'),
          row('placeholder', 'string', "'Select an option'", 'Text shown when nothing is selected.'),
          row('loop', 'boolean', 'true', 'Wraps keyboard navigation at the ends of the list.'),
          row('description', 'string', '-', 'Supporting text below the control.'),
          row('selectedContent', 'Snippet<[{ selected, selections }]>', '-', 'Custom display for the selected option or options.'),
          row('onchange', '(value: string | string[]) => void', '-', 'Runs after selection changes.')
        ],
        'Class and additional div attributes are forwarded to the root.'
      )
    ]
  },
  '/docs/components/code-window/': [
    props([
      row('label', 'string', "'Code'", 'Accessible label for the window.'),
      row('filename', 'string', '-', 'Optional filename shown above the code.'),
      row('fileIcon', 'Snippet', '-', 'Optional icon before the filename.'),
      row('code', 'string', '-', 'Raw source for copying and built-in line rendering when children are absent.'),
      row('lineNumbers', 'boolean', 'true', 'Shows line numbers when code is provided.'),
      row('highlightedLinesNumbers', 'number[]', '[]', 'One-based lines to emphasize.'),
      row('addedLinesNumbers', 'number[]', '[]', 'One-based added lines.'),
      row('removedLinesNumbers', 'number[]', '[]', 'One-based removed lines.'),
      row('renderLine', 'Snippet<[string, number]>', '-', 'Optional renderer for the content of each line.'),
      row('oncopied', '(code: string) => void', '-', 'Runs after the code is copied.'),
      row('oncopyerror', '() => void', '-', 'Runs when copying fails.'),
      row('embedded', 'boolean', 'false', 'Removes the outer border and radius when composed inside another shell.'),
      row('controls', 'Snippet', '-', 'Controls positioned above the scrollable viewport.'),
      row('children', 'Snippet', '-', 'Custom code presentation; when provided, code remains the copied source.')
    ])
  ],
  '/docs/components/snippet/': [
    props([
      row('text', 'string', 'required', 'Command or value copied by the control.', ['required']),
      row('label', 'string', "'Copy snippet'", 'Accessible label for the copy button.'),
      row('prompt', 'boolean', 'false', 'Shows a visual shell prompt without adding it to the copied text.'),
      row('class', 'string', "''", 'Additional class on the component root.')
    ])
  ],
  '/docs/components/footer/': {
    svelte: [
      props([
        row('variant', "'columns' | 'compact' | 'minimal'", "'columns'", 'Selects the footer layout.'),
        row('label', 'string', "'Footer'", 'Accessible label for the footer landmark.'),
        row('brand', 'string', "'Aesir'", 'Default brand text.'),
        row('description', 'string', '-', 'Supporting brand copy in the columns layout.'),
        row('columns', 'FooterColumn[]', '[]', 'Navigation groups with labels and links.'),
        row('socials', 'FooterLink[]', '[]', 'Social or external icon links.'),
        row('legalLinks', 'FooterLink[]', '[]', 'Legal navigation links.'),
        row('copyright', 'string', '-', 'Copyright or ownership line.'),
        row('brandContent', 'Snippet', '-', 'Custom brand content.'),
        row('children', 'Snippet', '-', 'Additional content in the lower row.')
      ])
    ],
    html: [
      props(
        [
          row('variant', "'columns' | 'compact' | 'minimal'", "'columns'", 'Selects the footer layout.'),
          row('label', 'string', "'Footer'", 'Accessible label for the footer landmark.'),
          row('brand', 'string', "'Aesir'", 'Default brand text.'),
          row('description', 'string', '-', 'Supporting brand copy in the columns layout.'),
          row('columns', 'JSON array', '[]', 'Navigation groups with labels and links.'),
          row('socials', 'JSON array', '[]', 'Social or external icon links.'),
          row('legal-links', 'JSON array', '[]', 'Legal navigation links.'),
          row('copyright', 'string', '-', 'Copyright or ownership line.'),
          row('has-brand-content', 'boolean', 'false', 'Uses the named brand slot instead of the brand text.'),
          row('brand slot', 'slot', '-', 'Custom brand content.'),
          row('default slot', 'slot', '-', 'Additional content in the lower row.')
        ],
        'Set array properties from JavaScript or provide them as JSON attributes.'
      )
    ]
  },
  '/docs/components/selection-toolbar/': [
    props([
      row('count', 'number', '0', 'Number of selected records.'),
      row('visible', 'boolean', 'count > 0', 'Explicit visibility override.'),
      row('label', 'string', "'selected'", 'Text displayed after the count.'),
      row('toolbarLabel', 'string', "'Selection actions'", 'Accessible toolbar label.'),
      row('clearLabel', 'string', "'Clear selection'", 'Accessible clear-button label.'),
      row('position', "'fixed' | 'absolute'", "'fixed'", 'Positions the toolbar against the viewport or a containing block.'),
      row('actions', 'Snippet', '-', 'Bulk action controls.'),
      row('onclear', '() => void', '-', 'Runs when the clear button is pressed.')
    ])
  ],
  '/docs/components/tree-view/': [
    props(
      [
        row('items', 'TreeItem[]', '[]', 'Recursive items with label, value/id, icon, description, disabled, and items.', ['required']),
        row('value', 'unknown', '-', 'Bindable selected item value.', ['bindable']),
        row('expanded', 'unknown[]', '[]', 'Bindable values of expanded branches.', ['bindable']),
        row('label', 'string', "'Tree view'", 'Accessible tree label.'),
        row('lines', 'boolean', 'true', 'Shows hierarchy guides aligned below ancestor disclosure controls.'),
        row('disabled', 'boolean', 'false', 'Disables the complete tree.'),
        row('selectBranches', 'boolean', 'false', 'Allows branch nodes to be selected; otherwise activating a branch only toggles it.'),
        row('onselect', '(item) => void', '-', 'Runs after selecting an enabled item.')
      ],
      'Class and additional attributes are forwarded to the tree root.'
    )
  ],
  '/docs/components/resizable-panels/': [
    props([
      row('size', 'number', '50', 'Bindable first-panel size as a percentage.', ['bindable']),
      row('orientation', "'horizontal' | 'vertical'", "'horizontal'", 'Panel axis.'),
      row('min', 'number', '20', 'Minimum first-panel percentage.'),
      row('max', 'number', '80', 'Maximum first-panel percentage.'),
      row('label', 'string', "'Resize panels'", 'Accessible separator label.'),
      row('disabled', 'boolean', 'false', 'Disables pointer and keyboard resizing.'),
      row('first', 'Snippet', '-', 'First panel content.', ['required']),
      row('second', 'Snippet', '-', 'Second panel content.', ['required'])
    ])
  ],
  '/docs/components/tag-input/': [
    props([
      row('options', 'TagOption[]', '[]', 'Available strings or objects with label, value, and disabled.'),
      row('value', 'unknown[]', '[]', 'Bindable selected values.', ['bindable']),
      row('query', 'string', "''", 'Bindable filter text.', ['bindable']),
      row('open', 'boolean', 'false', 'Bindable suggestion-list state.', ['bindable']),
      row('label', 'string', '-', 'Visible field label.'),
      row('description', 'string', '-', 'Supporting copy.'),
      row('placeholder', 'string', "'Add…'", 'Input placeholder.'),
      row('emptyText', 'string', "'No results'", 'Empty suggestion message.'),
      row('disabled', 'boolean', 'false', 'Disables editing and removal.'),
      row('max', 'number', '-', 'Maximum selected values.'),
      row('maxHeight', 'number', '256', 'Maximum suggestion panel height in pixels.'),
      row('allowCustom', 'boolean', 'false', 'Allows Enter to commit a value absent from options.'),
      row('closeOnSelect', 'boolean', 'true', 'Closes the suggestion panel after adding a value; disable for rapid multi-selection.'),
      row('onchange', '(value) => void', '-', 'Runs after adding or removing a value.')
    ])
  ],
  '/docs/components/date-range-picker/': [
    props([
      row('value', '{ start: string; end: string }', 'empty range', 'Bindable ISO date endpoints.', ['bindable']),
      row('label', 'string', "'Date range'", 'Group legend.'),
      row('startLabel', 'string', "'Start date'", 'Start picker label.'),
      row('endLabel', 'string', "'End date'", 'End picker label.'),
      row('locale', 'string', "'en-US'", 'Locale for both calendars.'),
      row('min', 'string', '-', 'Earliest start.'),
      row('max', 'string', '-', 'Latest end.'),
      row('disabled', 'boolean', 'false', 'Disables both pickers.'),
      row('onchange', '(range) => void', '-', 'Runs when either endpoint changes.')
    ])
  ],
  '/docs/components/stepper/': [
    props([
      row('items', 'StepperItem[]', '[]', 'Steps with value, label, description, eyebrow, icon, status, statusVariant, and disabled.', ['required']),
      row('value', 'unknown', 'first item', 'Bindable current step.', ['bindable']),
      row('orientation', "'horizontal' | 'vertical'", "'horizontal'", 'Step layout.'),
      row('label', 'string', "'Progress'", 'Accessible navigation label.'),
      row('linear', 'boolean', 'false', 'Disables steps after the current step.'),
      row('showStatus', 'boolean', 'true', 'Shows a semantic status badge below each step.'),
      row('completedLabel', 'string', "'Completed'", 'Fallback label for completed steps.'),
      row('currentLabel', 'string', "'In progress'", 'Fallback label for the current step.'),
      row('upcomingLabel', 'string', "'Pending'", 'Fallback label for upcoming steps.'),
      row('onchange', '(item) => void', '-', 'Runs after selecting a step.')
    ])
  ],
  '/docs/components/field/': [
    props(
      [
        row('id', 'string', 'generated', 'Id assigned to the associated control.'),
        row('label', 'string', '-', 'Visible field label.'),
        row('description', 'string', '-', 'Supporting copy displayed below the control.'),
        row('error', 'string', '-', 'Validation message and invalid state.'),
        row('optional', 'boolean', 'false', 'Adds a quiet “(optional)” suffix to the label.'),
        row('required', 'boolean', 'false', 'Exposes required state to the control snippet.'),
        row('disabled', 'boolean', 'false', 'Exposes disabled state and dims the field.'),
        row('reserveMessageSpace', 'boolean', 'false', 'Keeps support-message space for aligned layouts.'),
        row('children', 'Snippet<FieldContext>', '-', 'Control renderer receiving controlId, describedBy, invalid, disabled, and required.', ['required'])
      ],
      'Class, style, and additional attributes are forwarded to the field root. Apply the received context attributes to the rendered control.'
    )
  ],
  '/docs/components/loader/': [
    props([
      row('size', "'sm' | 'default' | 'lg'", "'default'", 'Loader diameter.'),
      row('variant', "'ring' | 'lines' | 'grid'", "'ring'", 'Visual treatment. Ring preserves the original spinner.'),
      row('pattern', "'pulse' | 'wave' | 'orbit'", "'pulse'", 'Lighting sequence used by the grid variant.'),
      row('label', 'string', "'Loading'", 'Accessible status label.'),
      row('decorative', 'boolean', 'false', 'Hides the spinner from assistive technology when adjacent text already describes progress.')
    ])
  ],
  '/docs/components/kbd/': [
    props([
      row('meta', 'boolean', 'false', 'Adds Command on Apple platforms or Control on Windows and Linux.'),
      row('shift', 'boolean', 'false', 'Adds the platform-appropriate Shift label.'),
      row('alt', 'boolean', 'false', 'Adds Option on Apple platforms or Alt on Windows and Linux.'),
      row('ctrl', 'boolean', 'false', 'Adds Control.'),
      row('small', 'boolean', 'false', 'Uses the compact size for dense surfaces.'),
      row('children', 'Snippet', '-', 'One key, digit, or named key such as K, 7, Enter, or Esc.', ['required'])
    ])
  ],
  '/docs/components/skeleton/': [
    props([
      row('width', 'string | number', "'100%'", 'Placeholder width; numbers are interpreted as pixels.'),
      row('height', 'string | number', '16', 'Placeholder height; numbers are interpreted as pixels.'),
      row('radius', "'sm' | 'md' | 'lg' | 'full'", "'md'", 'Corner radius.'),
      row('animated', 'boolean', 'true', 'Enables the shimmer animation unless reduced motion is requested.')
    ])
  ],
  '/docs/components/empty-state/': [
    props(
      [
        row('title', 'string', '-', 'Short explanation of the empty view.'),
        row('description', 'string', '-', 'Supporting guidance.'),
        row('size', "'sm' | 'default'", "'default'", 'Spacing density.'),
        row('icon', 'Snippet', '-', 'Decorative icon renderer.'),
        row('actions', 'Snippet', '-', 'Primary and optional secondary actions.'),
        row('children', 'Snippet', '-', 'Additional supporting content.')
      ],
      'In @aesir/html markup, pass the title with empty-state-title. The JavaScript property remains title.'
    )
  ],
  '/docs/components/pagination/': [
    props([
      row('page', 'number', '1', 'Bindable current page.', ['bindable']),
      row('totalPages', 'number', '1', 'Total number of pages.'),
      row('siblingCount', 'number', '1', 'Pages shown on each side of the current page.'),
      row('disabled', 'boolean', 'false', 'Disables every pagination action.'),
      row('label', 'string', "'Pagination'", 'Accessible navigation label.'),
      row('onpagechange', '(page: number) => void', '-', 'Runs after the current page changes.')
    ])
  ],
  '/docs/components/separator/': [
    props(
      [
        row('orientation', "'horizontal' | 'vertical'", "'horizontal'", 'Visual and semantic direction.'),
        row('decorative', 'boolean', 'true', 'Uses presentation semantics; set false when the division is meaningful.')
      ],
      'Class, style, and additional attributes are forwarded to the separator.'
    )
  ],
  '/docs/components/accordion/': [
    {
      title: 'AesirAccordion',
      rows: [
        row('items', 'AccordionItem[]', '[]', 'Sections rendered by the accordion. Media fields automatically enable the media layout.', ['required']),
        row('type', "'single' | 'multiple'", "'single'", 'Controls whether one or several items can be open. Media accordions always behave as single selection.'),
        row('value', 'string | string[]', 'first enabled item', 'Currently open item value, or values when type is multiple.', ['bindable']),
        row('collapsible', 'boolean', 'true', 'Allows the active item to close in single mode. Ignored by media accordions.'),
        row('disabled', 'boolean', 'false', 'Disables every accordion trigger.'),
        row('loop', 'boolean', 'true', 'Wraps focus when navigating triggers with Arrow Up and Arrow Down.'),
        row('headingLevel', '1 | 2 | 3 | 4 | 5 | 6', '3', 'Semantic heading level used for item headers.'),
        row('indicator', "'chevron' | 'plus-minus'", "'chevron'", 'Icon used to communicate the expanded state.'),
        row('onValueChange', '(value) => void', '-', 'Runs after the active value changes.'),
        row('itemContent', 'Snippet<{ item, open }>', '-', 'Custom renderer for expanded item content.'),
        row('media', 'Snippet<{ item }>', '-', 'Custom renderer for the active media panel.')
      ],
      note: 'Class, style, and additional attributes are forwarded to the accordion root.'
    },
    {
      title: 'AccordionItem',
      rows: [
        row('value', 'string', '-', 'Stable value used for selection and keyed rendering.', ['required']),
        row('title', 'string', '-', 'Visible trigger label.', ['required']),
        row('content', 'string', '-', 'Default expanded content when itemContent is not provided.'),
        row('disabled', 'boolean', 'false', 'Disables this item.'),
        row('icon', 'string', '-', 'Registered Aesir icon name displayed before the title.'),
        row('iconLabel', 'string', '-', 'Accessible label for a meaningful item icon.'),
        row('image', 'string', '-', 'Image URL. Adding it enables the media layout.'),
        row('imageAlt', 'string', "''", 'Alternative text for the image.'),
        row('video', 'string', '-', 'Video URL. Videos autoplay muted with playsinline and loop.'),
        row('poster', 'string', '-', 'Poster image shown while video data loads.'),
        row('mediaAlt', 'string', '-', 'Accessible label for video media.')
      ]
    }
  ],
  '/docs/components/context-menu/': [
    { title: 'AesirContextMenu', rows: [row('open', 'boolean', 'false', 'Bindable open state.'), row('children', 'Snippet', 'required', 'Compound trigger and content.', ['required'])] },
    {
      title: 'ContextMenuTrigger',
      rows: [row('children', 'Snippet', 'required', 'Area that opens the menu from pointer or keyboard.', ['required']), row('ref', 'HTMLElement', '-', 'Bindable trigger element.')]
    },
    {
      title: 'ContextMenuContent',
      rows: [row('children', 'Snippet', 'required', 'Menu items.', ['required']), row('portalProps', 'object', '-', 'Props forwarded to the portal.')],
      note: 'ARIA attributes and additional props are forwarded to the menu.'
    },
    {
      title: 'ContextMenuItem',
      rows: [
        row('icon', 'IconName', '-', 'Leading icon.'),
        row('shortcut', 'string | string[]', "''", 'Runs the item shortcut while the context menu is open.'),
        row('variant', "'default' | 'destructive'", "'default'", 'Visual intent.'),
        row('disabled', 'boolean', 'false', 'Prevents selection.'),
        row('onclick', '(event) => void', '-', 'Selection handler.')
      ]
    }
  ],
  '/docs/components/autocomplete-box/': [
    props([
      row('options', 'AutocompleteOption[]', '[]', 'Options with label, value, and optional disabled state.', ['required']),
      row('required', 'boolean', 'false', 'Shows Required after leaving an unselected field.'),
      row('error', 'string', '-', 'Validation message and invalid input styling.'),
      row('errorPlacement', "'message' | 'label'", "'message'", 'Display the error below the input or beside its label.'),
      row('description', 'string', '-', 'Supporting text when there is no error.'),
      row('maxHeight', 'number', '256', 'List height limit in pixels, constrained by viewport space.'),
      row('value', 'unknown', 'null', 'Bindable selected value.'),
      row('query', 'string', "''", 'Bindable search query.'),
      row('open', 'boolean', 'false', 'Bindable popup state.'),
      row('label', 'string', '-', 'Visible field label.'),
      row('placeholder', 'string', "'Search…'", 'Input placeholder.'),
      row('emptyText', 'string', "'No results'", 'Empty result message.'),
      row('disabled', 'boolean', 'false', 'Disables the control.'),
      row('onselect', '(option) => void', '-', 'Runs after an option is selected.')
    ])
  ],
  '/docs/components/date-picker/': [
    props([
      row('value', 'string', "''", 'Bindable date in YYYY-MM-DD format.'),
      row('open', 'boolean', 'false', 'Bindable calendar state.'),
      row('label', 'string', '-', 'Visible field label.'),
      row('locale', 'string', "'en-US'", 'Locale for calendar labels.'),
      row('min', 'string', '-', 'Earliest selectable date.'),
      row('max', 'string', '-', 'Latest selectable date.'),
      row('disabled', 'boolean', 'false', 'Disables the picker.'),
      row('onselect', '(date) => void', '-', 'Runs after a date is selected.')
    ])
  ],
  '/docs/components/file-upload/': [
    props(
      [
        row('files', 'File[]', '[]', 'Bindable accepted files.'),
        row('accept', 'string', '-', 'Comma-separated MIME types or extensions accepted by the picker and dropzone.'),
        row('multiple', 'boolean', 'false', 'Allows more than one file.'),
        row('maxSize', 'number', '-', 'Maximum file size in bytes.'),
        row('maxFiles', 'number', '1 or unlimited', 'Maximum number of accepted files.'),
        row('disabled', 'boolean', 'false', 'Disables selection and dropping.'),
        row('label', 'string', "'Upload files'", 'Primary dropzone label.'),
        row('description', 'string', "'Drag and drop…'", 'Supporting instructions.'),
        row('browseLabel', 'string', "'Choose files'", 'Picker action label.'),
        row('showList', 'boolean', 'true', 'Shows accepted files with remove actions.'),
        row('onselect', '(files) => void', '-', 'Runs with newly accepted files.'),
        row('onreject', '(files) => void', '-', 'Runs with files rejected by type, size, or count.')
      ],
      'Client-side constraints improve feedback but do not replace server-side file validation.'
    )
  ],
  '/docs/components/menubar/': [
    props(
      [
        row('menus', 'MenubarMenu[]', '[]', 'Top-level menus and action items supporting icon, shortcut, action, role, checked, disabled, and variant.', ['required']),
        row('value', 'string | null', 'null', 'Bindable open menu value.'),
        row('label', 'string', "'Application menu'", 'Accessible menubar label.'),
        row('onselect', '(item) => void', '-', 'Runs after an action is selected.')
      ],
      'Item shortcuts work globally outside editable fields. Reserved browser shortcuts are neither rendered nor intercepted.'
    )
  ],
  '/docs/components/quantity-stepper/': [
    props(
      [
        row('value', 'number', '1', 'Bindable current quantity.'),
        row('min', 'number', '1', 'Lowest accepted quantity.'),
        row('max', 'number', 'Infinity', 'Highest accepted quantity.'),
        row('step', 'number', '1', 'Amount added or removed by each action.'),
        row('label', 'string', "'Quantity'", 'Accessible name used by the group, input, and actions.'),
        row('name', 'string', '-', 'Native form name for the number input.'),
        row('disabled', 'boolean', 'false', 'Disables typing and both actions.'),
        row('onchange', '(value) => void', '-', 'Runs after a committed typed or stepped value.')
      ],
      'Values are clamped to min and max. Additional attributes are forwarded to the root group.'
    )
  ],
  '/docs/components/navbar/': [
    props(
      [
        row('brand', 'NavbarBrand', "{ label: 'Aesir', href: '/' }", 'Brand label, destination, image source, icon, and accessible label.'),
        row(
          'items',
          'NavbarItem[]',
          '[]',
          'Links or dropdown groups. Set menu: "mega" to use a shared navbar-wide panel across desktop groups. Children accept label, description, icon, href, action, disabled, eyebrow, and featured.'
        ),
        row('layout', "'contained' | 'full'", "'contained'", 'Constrains content to 72rem or uses all available width.'),
        row('variant', "'default' | 'floating'", "'default'", 'Edge-to-edge bar or inset rounded surface. Positioning is controlled by the page.'),
        row('align', "'start' | 'center'", "'start'", 'Alignment of the primary navigation.'),
        row('brandPosition', "'start' | 'center'", "'start'", 'Centers the brand independently for editorial layouts.'),
        row('menuTrigger', "'click' | 'hover'", "'click'", 'Hover opens on mouse entry, with a short exit delay. Click, keyboard, and touch remain supported.'),
        row('menuOpenDelay', 'number', '90', 'Delay before a hover-triggered menu opens, in milliseconds.'),
        row('menuCloseDelay', 'number', '160', 'Delay before a hover-triggered menu closes, in milliseconds.'),
        row('onsearch', '(event) => void', '-', 'Shows a persistent search trigger. Connect to your shared Command Menu.'),
        row('searchLabel', 'string', "'Search…'", 'Visible search text and accessible label on mobile.'),
        row('searchHint', 'string', '-', 'Optional key rendered with a platform-aware Meta modifier; wire the shortcut in Command Menu.'),
        row('mobileOpen', 'boolean', 'false', 'Bindable mobile navigation state.'),
        row('label', 'string', "'Main navigation'", 'Accessible nav label.'),
        row('avatar', 'AvatarConfig', '-', 'Optional account avatar. Add items: DropdownItem[] for a built-in account menu.'),
        row('onselect', '(item) => void', '-', 'Runs after a link or dropdown item is selected.'),
        row('onavatarclick', '(event) => void', '-', 'Runs after the account avatar is pressed.'),
        row('logo', 'Snippet<{ brand }>', '-', 'Custom brand renderer.'),
        row('actions', 'Snippet', '-', 'Actions rendered before the avatar.'),
        row('utilities', 'Snippet', '-', 'Persistent controls between actions and avatar, visible on desktop and mobile.'),
        row('secondary', 'Snippet', '-', 'Optional second navigation row. Wraps on desktop and uses two columns on mobile.')
      ],
      'Navbar uses AesirDropdown, AesirButton, AesirAvatar, and AesirIcon internally. At narrow widths, links become an accessible disclosure menu.'
    )
  ],
  '/docs/button/': [
    props(
      [
        row('variant', "'default' | 'accent' | 'secondary' | 'outline' | 'ghost' | 'destructive'", "'default'", 'Visual treatment.'),
        row('size', "'sm' | 'default' | 'lg' | 'icon-sm' | 'icon' | 'icon-lg'", "'default'", 'Control height and padding.'),
        row('width', "'default' | 'full'", "'default'", 'Content width or full container width.'),
        row('radius', "'none' | 'full'", '-', 'Optional radius override.'),
        row('href', 'string', '-', 'Renders an anchor instead of a button.'),
        row('type', "'button' | 'submit' | 'reset'", "'button'", 'Native button type when href is not set.'),
        row('disabled', 'boolean', 'false', 'Disables button or anchor interaction.'),
        row('ref', 'HTMLButtonElement | HTMLAnchorElement', 'null', 'Bindable element reference.'),
        row('child', 'Snippet<{ props }>', '-', 'Opt-in render delegation. Spread props on one button or anchor.'),
        row('children', 'Snippet', '-', 'Button content.')
      ],
      'Additional attributes are forwarded to the rendered button or anchor.'
    )
  ],
  '/docs/icons/': {
    svelte: [
      {
        title: 'AesirIcon',
        rows: [
          row('icon', 'Component<LucideProps> | IconNode', '-', 'Imported Lucide component, custom icon component, or Lucide icon-node data.'),
          row('name', 'string', '-', 'Registered icon name used when icon is not provided.'),
          row('label', 'string', '-', 'Accessible name for a meaningful standalone icon. Icons without a label are decorative.'),
          row('size', 'number | string', "'1em'", 'Icon width and height.'),
          row('color', 'string', "'currentColor'", 'Stroke or fill color inherited by the icon.'),
          row('strokeWidth', 'number | string', '2', 'Lucide stroke width.'),
          row('absoluteStrokeWidth', 'boolean', 'false', 'Keeps the apparent stroke width constant when the icon size changes.'),
          row('mirrored', 'boolean', 'false', 'Mirrors compatible icons horizontally.'),
          row('children', 'Snippet', '-', 'Additional SVG geometry rendered inside the icon.')
        ],
        note: 'Additional SVG attributes are forwarded to the rendered svg element.'
      },
      {
        title: 'AesirIconSwap',
        rows: [
          row('name', 'string', 'required', 'Icon shown in the inactive state.', ['required']),
          row('activeName', 'string', 'required', 'Icon shown in the active state.', ['required']),
          row('active', 'boolean', 'false', 'Selects the active icon.'),
          row('size', 'number | string', '16', 'Width and height of both icons.'),
          row('class', 'string', "''", 'Additional class on the component root.')
        ]
      }
    ],
    html: [
      {
        title: 'aesir-icon',
        rows: [
          row('name', 'string', 'required', 'Registered icon name.', ['required']),
          row('label', 'string', '-', 'Accessible name for a meaningful standalone icon. Icons without a label are decorative.'),
          row('size', 'number', '20', 'Icon width and height in pixels.'),
          row('stroke-width', 'number', '2', 'Lucide stroke width.')
        ],
        note: 'Load the icon catalog before the component bundle so names can be resolved.'
      },
      {
        title: 'aesir-icon-swap',
        rows: [
          row('name', 'string', 'required', 'Icon shown in the inactive state.', ['required']),
          row('active-name', 'string', 'required', 'Icon shown in the active state.', ['required']),
          row('active', 'boolean', 'false', 'Selects the active icon.'),
          row('size', 'number', '16', 'Width and height of both icons in pixels.')
        ]
      }
    ]
  },
  '/docs/components/alert/': [
    props(
      [
        row('variant', "'default' | 'info' | 'success' | 'warning' | 'destructive'", "'default'", 'Semantic visual treatment.'),
        row('icon', 'string', '-', 'Registered Aesir icon name.'),
        row('title', 'string', '-', 'Short alert heading.'),
        row('titleElement', 'string', "'div'", 'Element used for the title.'),
        row('description', 'string', '-', 'Supporting message.'),
        row('role', "'status' | 'alert' | string", 'derived', 'Defaults to alert for destructive and status otherwise.'),
        row('action', 'Snippet', '-', 'Compact related action.'),
        row('children', 'Snippet', '-', 'Custom description content.')
      ],
      'Additional attributes are forwarded to the alert container. In @aesir/html markup, pass the title with alert-title; the JavaScript property remains title.'
    )
  ],
  '/docs/components/annotation/': [
    props(
      [
        row('id', 'string', '-', 'Stable StateField entry identifier for the stored range or operation.', ['required']),
        row('kind', "'comment' | 'suggestion'", "'comment'", 'Selects discussion actions or suggestion review actions.'),
        row('author', 'AnnotationAuthor', '-', 'Author name, avatar src, and fallback initials.', ['required']),
        row('time', 'string', '-', 'Human-readable timestamp displayed below the author.'),
        row('text', 'string', "''", 'Comment body. Used when kind is comment.'),
        row('diff', 'AnnotationDiffPart[]', '[]', "Ordered diff parts with type 'del' or 'ins'. Used when kind is suggestion."),
        row('active', 'boolean', 'false', 'Shows the active treatment and reply composer.'),
        row('editable', 'boolean', 'false', 'Adds Edit to the comment actions menu.'),
        row('onactivate', '(active) => void', '-', 'Requests activation or deactivation of this annotation.'),
        row('onresolve', '() => void', '-', 'Runs when a comment is resolved.'),
        row('onremove', '() => void', '-', 'Runs when a comment is removed.'),
        row('onedit', '(text) => void', '-', 'Runs after edited comment text is saved.'),
        row('onaccept', '() => void', '-', 'Runs when a suggestion is accepted.'),
        row('onreject', '() => void', '-', 'Runs when a suggestion is rejected.'),
        row('onreply', '(text) => void', '-', 'Runs after a reply is submitted.')
      ],
      'Class, style, and additional attributes are forwarded to the annotation root. Anchoring and persistence remain the responsibility of the containing review surface.'
    )
  ],
  '/docs/components/avatar/': [
    props(
      [
        row('src', 'string', '-', 'Image URL.'),
        row('alt', 'string', "''", 'Accessible identity label.'),
        row('aria-label', 'string', '-', 'Overrides the accessible label.'),
        row('fallback', 'string', "''", 'Initials shown when the image is absent or fails.'),
        row('size', "'sm' | 'default' | 'lg'", "'default'", 'Avatar diameter.'),
        row('loading', "'lazy' | 'eager'", "'lazy'", 'Native image loading behavior.'),
        row('decoding', "'async' | 'sync' | 'auto'", "'async'", 'Native image decoding behavior.')
      ],
      'Additional attributes are forwarded to the avatar wrapper.'
    )
  ],
  '/docs/components/badge/': [
    {
      title: 'Badge Props',
      rows: [
        row('variant', "'default' | 'secondary' | 'outline' | 'accent' | 'info' | 'success' | 'warning' | 'destructive'", "'default'", 'Visual or semantic treatment.'),
        row('size', "'xs' | 'sm' | 'default' | 'lg'", "'default'", 'Badge size.'),
        row('font', "'default' | 'mono'", "'default'", 'Use mono for counters and code-like labels.'),
        row('children', 'Snippet', '-', 'Badge content.')
      ],
      note: 'Additional attributes are forwarded to the badge span.'
    },
    {
      title: 'Pill Props',
      rows: [row('href', 'string', '-', 'Link destination.', ['required']), row('size', "'sm' | 'default' | 'lg'", "'default'", 'Pill size.'), row('children', 'Snippet', '-', 'Pill content.')],
      note: 'Additional attributes are forwarded to the rendered anchor or span.'
    }
  ],
  '/docs/components/breadcrumb/': [
    props(
      [
        row('items', 'BreadcrumbItem[]', '[]', 'Ordered hierarchy; the final item is the current page.'),
        row('label', 'string', "'Breadcrumb'", 'Accessible navigation label.'),
        row('separator', 'string', "'chevron-right'", 'Registered Aesir icon name.'),
        row('ref', 'HTMLElement', 'null', 'Bindable navigation element reference.')
      ],
      'Each item accepts id, label or title, and an optional href.'
    )
  ],
  '/docs/components/button-group/': [
    props(
      [
        row('orientation', "'horizontal' | 'vertical'", "'horizontal'", 'Group direction.'),
        row('size', "'sm' | 'default' | 'lg'", "'default'", 'Normalizes child control height.'),
        row('children', 'Snippet', '-', 'Buttons, links, fields, or addons.')
      ],
      'Additional attributes are forwarded to the group container.'
    )
  ],
  '/docs/components/toggle/': [
    props(
      [
        row('pressed', 'boolean', 'false', 'Bindable on/off state.'),
        row('variant', "'default' | 'outline'", "'default'", 'Visual treatment.'),
        row('size', "'sm' | 'default' | 'lg' | 'icon-sm' | 'icon' | 'icon-lg'", "'default'", 'Control size.'),
        row('disabled', 'boolean', 'false', 'Disables interaction.'),
        row('onpressedchange', '(pressed: boolean) => void', '-', 'Runs after the pressed state changes.'),
        row('ref', 'HTMLButtonElement', 'null', 'Bindable button reference.'),
        row('children', 'Snippet', '-', 'Text, icon, or both.')
      ],
      'Additional native button attributes are forwarded to the button. Icon-only toggles require an aria-label.'
    )
  ],
  '/docs/components/toggle-group/': [
    {
      title: 'AesirToggleGroup',
      rows: [
        row('type', "'single' | 'multiple'", "'single'", 'Selects one value or an array of values.'),
        row('value', 'string | string[]', '-', 'Bindable selected value or values.'),
        row('variant', "'default' | 'outline'", "'default'", 'Visual treatment inherited by items.'),
        row('size', "'sm' | 'default' | 'lg' | 'icon-sm' | 'icon' | 'icon-lg'", "'default'", 'Size inherited by items.'),
        row('orientation', "'horizontal' | 'vertical'", "'horizontal'", 'Layout and arrow-key direction.'),
        row('spacing', 'number', '2', 'Gap token between items; use 0 for connected controls.'),
        row('disabled', 'boolean', 'false', 'Disables every item.'),
        row('required', 'boolean', 'false', 'Prevents clearing the selected value in single mode.'),
        row('loop', 'boolean', 'true', 'Wraps arrow-key focus at the group edges.'),
        row('label', 'string', "'Toggle group'", 'Accessible group label.'),
        row('onvaluechange', '(value: string | string[]) => void', '-', 'Runs after selection changes.')
      ]
    },
    {
      title: 'AesirToggleGroupItem',
      rows: [
        row('value', 'string', '-', 'Stable selection value.', ['required']),
        row('variant', "'default' | 'outline'", 'inherited', 'Optional item-level visual override.'),
        row('size', "'sm' | 'default' | 'lg' | icon sizes", 'inherited', 'Optional item-level size override.'),
        row('disabled', 'boolean', 'false', 'Disables this item.'),
        row('children', 'Snippet', '-', 'Text, icon, or both.')
      ]
    }
  ],
  '/docs/components/card/': [
    props(
      [
        row('title', 'string', '-', 'Card title.'),
        row('titleElement', 'string', "'div'", 'Element used for the title.'),
        row('description', 'string', '-', 'Supporting header copy.'),
        row('headerAction', 'Snippet', '-', 'Action aligned with the title.'),
        row('children', 'Snippet', '-', 'Main card content.'),
        row('footer', 'Snippet', '-', 'Footer content.')
      ],
      'Additional attributes are forwarded to the card container. In @aesir/html markup, pass the title with card-title; the JavaScript property remains title.'
    )
  ],
  '/docs/components/checkbox/': [
    props(
      [
        row('checked', 'boolean', 'false', 'Bindable checked state.'),
        row('indeterminate', 'boolean', 'false', 'Displays a mixed state for partial group selection.'),
        row('label', 'string', '-', 'Visible option label.'),
        row('description', 'string', '-', 'Supporting copy.'),
        row('disabled', 'boolean', 'false', 'Disables the native checkbox.')
      ],
      'Native input attributes such as name, value, required, and onchange are forwarded.'
    )
  ],
  '/docs/components/collapsible/': [
    props(
      [
        row('open', 'boolean', 'false', 'Bindable expanded state.'),
        row('title', 'string', '-', 'Default trigger label when a custom trigger snippet is not provided.'),
        row('disabled', 'boolean', 'false', 'Disables the disclosure trigger.'),
        row('triggerPosition', "'top' | 'bottom'", "'top'", 'Places the trigger before or after the collapsible content.'),
        row('indicator', "'chevron' | 'plus-minus'", "'chevron'", 'Icon used to communicate the expanded state.'),
        row('trigger', 'Snippet<{ open }>', '-', 'Custom trigger content receiving the current expanded state.'),
        row('children', 'Snippet', '-', 'Content revealed by the collapsible.')
      ],
      'Class, style, and additional attributes are forwarded to the collapsible root. In @aesir/html markup, pass the title with collapsible-title; the JavaScript property remains title.'
    )
  ],
  '/docs/components/command-menu/': [
    props([
      row('open', 'boolean', 'false', 'Bindable dialog visibility.'),
      row('groups', 'CommandGroup[]', '[]', 'Grouped command items. An item may define nested groups and a step-specific placeholder.'),
      row('placeholder', 'string', "'Type a command or search…'", 'Search input placeholder.'),
      row('emptyText', 'string', "'No commands found.'", 'Empty-result message.'),
      row('label', 'string', "'Command menu'", 'Accessible dialog label.'),
      row('title', 'string', '-', 'Optional visible title above the search field.'),
      row('shortcut', 'string | false', "'k'", 'Global ⌘/Ctrl shortcut key, or false to disable.'),
      row('showFooter', 'boolean', 'false', 'Shows keyboard hints.'),
      row('onselect', '(item) => void', '-', 'Runs after an enabled item is selected.'),
      row('itemContent', 'Snippet<CommandItem>', '-', 'Replaces the visual contents of each command while preserving its behavior.'),
      row('headerMeta', 'Snippet<{ query, currentPage }>', '-', 'Optional content aligned opposite the visible title.'),
      row('content', 'Snippet<{ query, currentPage, close }>', '-', 'Replaces the command list with a custom searchable surface.'),
      row('footer', 'Snippet<{ query, currentPage, close }>', '-', 'Replaces the standard keyboard-hint footer.')
    ])
  ],
  '/docs/components/dialog/': [
    props(
      [
        row('open', 'boolean', 'false', 'Bindable dialog visibility.'),
        row('title', 'string', '-', 'Dialog title and accessible label.'),
        row('description', 'string', '-', 'Supporting header copy.'),
        row('closeLabel', 'string', "'Close dialog'", 'Accessible close-button label.'),
        row('children', 'Snippet', '-', 'Dialog body.'),
        row('footer', 'Snippet<{ close }>', '-', 'Footer content with a close callback.')
      ],
      'Class, style, and additional attributes are forwarded to the dialog panel. In @aesir/html markup, pass the title with dialog-title; the JavaScript property remains title.'
    )
  ],
  '/docs/components/drawer/': [
    props(
      [
        row('open', 'boolean', 'false', 'Bindable drawer visibility.'),
        row('side', "'left' | 'right'", "'left'", 'Viewport edge the drawer enters from.'),
        row('label', 'string', "'Drawer'", 'Accessible dialog label.'),
        row('closeLabel', 'string', "'Close drawer'", 'Accessible close-button label.'),
        row('returnFocus', 'HTMLElement', 'previous focus', 'Element focused after the drawer closes.'),
        row('onclose', '() => void', '-', 'Runs after a close interaction.'),
        row('header', 'Snippet<{ close }>', '-', 'Optional content before the close button.'),
        row('children', 'Snippet<{ close }>', '-', 'Main drawer content.'),
        row('footer', 'Snippet<{ close }>', '-', 'Optional footer actions.')
      ],
      'Class, style, id, and additional attributes are forwarded to the drawer panel. Set --aesir-drawer-width to customize its width.'
    )
  ],
  '/docs/components/dropdown/': {
    svelte: [
      props(
        [
          row('items', 'DropdownItem[]', '[]', "Actions, links, recursive submenu items, labels (`type: 'label'`), or separators (`type: 'separator'`)."),
          row('open', 'boolean', 'false', 'Bindable menu visibility.'),
          row('placement', "'top' | 'bottom'", "'bottom'", 'Preferred placement.'),
          row('align', "'start' | 'center' | 'end'", "'start'", 'Horizontal alignment against the trigger, clamped to the viewport.'),
          row('openOnHover', 'boolean', 'false', 'Mouse hover activation with a short exit delay; click and keyboard still work.'),
          row('openDelay', 'number', '90', 'Delay before opening from hover in milliseconds.'),
          row('closeDelay', 'number', '160', 'Delay before closing after hover in milliseconds.'),
          row('anchorElement', 'HTMLElement', '-', 'Optional positioning anchor instead of the trigger. Used by navbar-wide menus.'),
          row('focusElement', 'HTMLElement', '-', 'Optional active trigger to restore focus to when sharing one panel across triggers.'),
          row('hoverFromTrigger', 'boolean', 'true', 'Set false for grouped triggers and call the trigger snippet’s onpointerenter handler on each button.'),
          row('contentKey', 'unknown', '-', 'Changing this key updates panel positioning and subtly animates its contents, respecting keyboard and reduced-motion preferences.'),
          row('contentDirection', 'number', '1', 'Direction of shared-panel content transitions: 1 for the next group, -1 for the previous group.'),
          row('offset', 'number', '8', 'Distance from the trigger in pixels.'),
          row('matchTriggerWidth', 'boolean', 'false', 'Matches the menu panel width to its trigger.'),
          row('matchViewportWidth', 'boolean', 'false', 'Spans the viewport horizontally while retaining the vertical anchor position. Takes precedence over matchTriggerWidth.'),
          row('mobileLayout', "'compact' | 'full'", "'compact'", 'Keeps a compact panel anchored to its trigger or uses a viewport-width panel on small and coarse-pointer screens.'),
          row('mobileBreakpoint', 'number', '640', 'Viewport width in pixels at which the mobile layout activates.'),
          row('label', 'string', "'Dropdown menu'", 'Accessible menu label.'),
          row('error', 'boolean | string', 'false', 'Marks the trigger as invalid and applies aria-invalid with the destructive validation ring.'),
          row('contentClass', 'string', "''", 'Class applied to the portal menu panel.'),
          row('contentStyle', 'string', '-', 'Inline style applied to the portal menu panel.'),
          row('onselect', '(item) => void', '-', 'Runs after selection.'),
          row('trigger', 'Snippet<TriggerProps>', '-', 'Trigger receiving required interaction props.'),
          row('itemContent', 'Snippet<{ item }>', '-', 'Custom item renderer.')
        ],
        'Item shortcuts run while the menu is open. Reserved browser shortcuts are neither rendered nor intercepted. Class, style, and additional attributes are forwarded to the trigger root.'
      )
    ],
    html: [
      props(
        [
          row('items', 'JSON string | array', '[]', 'Actions, links, recursive submenu items, labels, or separators.'),
          row('open', 'boolean', 'false', 'Reflected menu visibility property.'),
          row('placement', "'top' | 'bottom'", "'bottom'", 'Preferred vertical placement.'),
          row('align', "'start' | 'center' | 'end'", "'end'", 'Horizontal alignment against the slotted trigger.'),
          row('open-on-hover', 'boolean', 'false', 'Opens from mouse hover while retaining click and keyboard interaction.'),
          row('offset', 'number', '8', 'Distance from the trigger in pixels.'),
          row('match-trigger-width', 'boolean', 'false', 'Matches the panel width to the trigger.'),
          row('match-viewport-width', 'boolean', 'false', 'Spans the viewport while retaining the vertical anchor position.'),
          row('mobile-layout', "'compact' | 'full'", "'compact'", 'Keeps a compact panel anchored to its trigger or uses a viewport-width panel on small and coarse-pointer screens.'),
          row('mobile-breakpoint', 'number', '640', 'Viewport width in pixels at which the mobile layout activates.'),
          row('width', "'auto' | 'full'", "'auto'", 'Stretches the trigger wrapper when set to full.'),
          row('content-class', 'string', "''", 'Class applied to the portal menu panel.'),
          row('content-style', 'string', '-', 'Inline style applied to the portal menu panel.'),
          row('label', 'string', "'Dropdown menu'", 'Accessible menu label.'),
          row('error', 'boolean', 'false', 'Marks the trigger as invalid.'),
          row('select', 'CustomEvent<DropdownItem>', '-', 'Bubbling, composed event dispatched after selecting an enabled terminal item.')
        ],
        'Place the trigger in the default slot. Styling hooks are exposed as the anchor, content, and label CSS parts.'
      )
    ]
  },
  '/docs/components/input/': [
    props(
      [
        row('value', 'string | number', "''", 'Bindable native input value.'),
        row('id', 'string', 'generated', 'Native input id.'),
        row('label', 'string', '-', 'Visible label.'),
        row('description', 'string', '-', 'Supporting copy.'),
        row('error', 'string', '-', 'Validation message and invalid state.'),
        row('type', 'string', "'text'", 'Native input type.'),
        row('size', "'sm' | 'default' | 'lg'", "'default'", 'Control height, text size, and number-stepper size.'),
        row('disabled', 'boolean', 'false', 'Disables the native input.'),
        row('optional', 'boolean', 'false', 'Adds a quiet “(optional)” suffix to the label.'),
        row('required', 'boolean', 'false', 'Enables native required-field validation.'),
        row('aria-describedby', 'string', '-', 'Additional description ids.')
      ],
      'Native input attributes such as name, autocomplete, placeholder, required, and inputmode are forwarded.'
    )
  ],
  '/docs/components/native-select/': [
    props(
      [
        row('value', 'string | number', '-', 'Bindable selected value.'),
        row('options', 'SelectOption[]', '[]', 'Options with value, label, and optional disabled.'),
        row('label', 'string', '-', 'Visible label.'),
        row('description', 'string', '-', 'Supporting copy.'),
        row('placeholder', 'string', '-', 'Disabled placeholder option.'),
        row('disabled', 'boolean', 'false', 'Disables the native select.'),
        row('optional', 'boolean', 'false', 'Adds a quiet “(optional)” suffix to the label.'),
        row('required', 'boolean', 'false', 'Enables native required-field validation.')
      ],
      'Native select attributes such as name, required, and onchange are forwarded.'
    )
  ],
  '/docs/components/popover/': [
    props(
      [
        row('open', 'boolean', 'false', 'Bindable popover visibility.'),
        row('placement', "'top' | 'bottom'", "'bottom'", 'Preferred placement.'),
        row('align', "'start' | 'center' | 'end'", "'center'", 'Aligns the panel along the trigger.'),
        row('offset', 'number', '8', 'Distance from the trigger in pixels.'),
        row('openOnHover', 'boolean', 'false', 'Opens from mouse hover while preserving click interaction.'),
        row('openDelay', 'number', '700', 'Delay before opening from hover in milliseconds.'),
        row('closeDelay', 'number', '300', 'Delay before closing after leaving the hover grace area.'),
        row('contentClass', 'string', "''", 'Class applied to the portal popover panel.'),
        row('contentStyle', 'string', '-', 'Inline style applied to the portal popover panel.'),
        row('trigger', 'Snippet<TriggerProps>', '-', 'Trigger receiving required interaction props.'),
        row('content', 'Snippet<{ close }>', '-', 'Popover content with a close callback.')
      ],
      'Class, style, and additional attributes are forwarded to the trigger root.'
    )
  ],
  '/docs/components/progress/': [
    props([
      row('value', 'number', '0', 'Current completed value.'),
      row('max', 'number', '100', 'Value representing completion.'),
      row('label', 'string', '-', 'Visible and accessible operation label.'),
      row('showValue', 'boolean', 'false', 'Shows the formatted value beside the label.'),
      row('indeterminate', 'boolean', 'false', 'Communicates activity when completion cannot be measured.'),
      row('size', "'sm' | 'default' | 'lg'", "'default'", 'Track thickness.'),
      row('variant', "'default' | 'success' | 'warning' | 'destructive'", "'default'", 'Semantic indicator color.'),
      row('formatValue', '(value, max) => string', '-', 'Formats visible and assistive value text.')
    ])
  ],
  '/docs/components/radio/': [
    props(
      [
        row('group', 'unknown', '-', 'Bindable value shared by every option in the group.'),
        row('value', 'unknown', '-', 'Value represented by this option.'),
        row('label', 'string', '-', 'Visible option label.'),
        row('description', 'string', '-', 'Supporting copy.'),
        row('name', 'string', '-', 'Native radio group name.'),
        row('disabled', 'boolean', 'false', 'Disables the native radio.')
      ],
      'Additional native input attributes are forwarded.'
    )
  ],
  '/docs/components/scroll-area/': [
    props(
      [
        row('orientation', "'vertical' | 'horizontal' | 'both'", "'vertical'", 'Enabled scroll axes.'),
        row('ref', 'HTMLElement', 'null', 'Bindable root element reference.'),
        row('viewportRef', 'HTMLElement', 'null', 'Bindable scrolling viewport reference.'),
        row('children', 'Snippet', '-', 'Scrollable content.')
      ],
      'Set an explicit height on the component or its containing layout.'
    )
  ],
  '/docs/components/sidebar/': [
    props(
      [
        row('title', 'string', "'Navigation'", 'Mobile header title.'),
        row('label', 'string', 'title', 'Accessible navigation label.'),
        row('variant', "'classic' | 'app'", "'classic'", 'Visual treatment. App is the denser treatment for application shells; Classic preserves the original design.'),
        row('mode', "'responsive' | 'desktop' | 'mobile'", "'responsive'", 'Responsive behavior, or an explicitly controlled presentation mode.'),
        row('items', 'SidebarItem[]', '[]', 'Navigation items with id/value, label, href, items, icon/iconSrc, badge, divider, target, rel and disabled.'),
        row('branchBehavior', "'toggle' | 'split' | 'navigate'", "'toggle'", 'Navigate follows a parent link and expands its children; split keeps a separate disclosure control.'),
        row(
          'autoExpandActive',
          'boolean',
          'true',
          'Expands the active branch and its ancestors whenever value or its navigation path changes. Manual collapse remains possible until navigation changes.'
        ),
        row('treeLines', 'boolean', 'false', 'Adds a left border along every expanded child list. Customize with --aesir-sidebar-tree-border.'),
        row('stickyBranches', 'boolean', 'false', 'Pins expanded top-level branch headings inside the navigation scroll.'),
        row('mobileTrigger', "'header' | 'floating'", "'header'", 'Mobile location bar or floating drawer trigger.'),
        row('sections', 'SidebarSection[]', '[]', 'Grouped navigation; takes precedence over items.'),
        row('value', 'unknown', '-', 'Bindable selected item value.'),
        row('expanded', 'unknown[]', '[]', 'Bindable values of expanded items with nested navigation.'),
        row('open', 'boolean', 'false', 'Bindable mobile drawer visibility.'),
        row('width', 'number', '256', 'Bindable desktop width in pixels.'),
        row('minWidth', 'number', '208', 'Minimum resizable desktop width in pixels.'),
        row('maxWidth', 'number', '448', 'Maximum resizable desktop width in pixels.'),
        row('resizable', 'boolean', 'false', 'Enables the pointer and keyboard resize handle on desktop.'),
        row('collapsible', 'boolean', 'false', 'Enables a desktop edge trigger that can hide the sidebar completely.'),
        row('collapsed', 'boolean', 'false', 'Bindable desktop collapsed state.'),
        row('collapseTrigger', "'edge' | 'external'", "'edge'", 'Renders the built-in edge trigger or delegates the control to the application shell.'),
        row('sticky', 'boolean', 'true', 'Keeps desktop navigation pinned within the viewport.'),
        row('stickyTop', 'string', "'0px'", 'Offset shared by the desktop sidebar and mobile breadcrumb header.'),
        row('resizeLabel', 'string', "'Resize navigation'", 'Accessible resize-handle label.'),
        row('collapseLabel', 'string', "'Collapse navigation'", 'Accessible label while the desktop sidebar is open.'),
        row('expandLabel', 'string', "'Expand navigation'", 'Accessible label while the desktop sidebar is collapsed.'),
        row('closeLabel', 'string', "'Close navigation'", 'Accessible close-button label.'),
        row('menuLabel', 'string', "'Open navigation'", 'Accessible menu-button label.'),
        row('onselect', '(item) => void', '-', 'Runs after an enabled item is selected.'),
        row('header', 'Snippet', '-', 'Optional workspace or brand content above navigation.'),
        row('footer', 'Snippet', '-', 'Optional account or secondary content below navigation.')
      ],
      'Class, style, and additional attributes are forwarded to the sidebar root. In @aesir/html markup, pass the title with sidebar-title; the JavaScript property remains title.'
    )
  ],
  '/docs/components/slider/': [
    props(
      [
        row('value', 'number', '50', 'Bindable slider value.'),
        row('min', 'number', '0', 'Minimum value.'),
        row('max', 'number', '100', 'Maximum value.'),
        row('step', 'number', '1', 'Allowed value increment.'),
        row('label', 'string', '-', 'Visible slider label.'),
        row('showValue', 'boolean', 'true', 'Shows the current value.'),
        row('disabled', 'boolean', 'false', 'Disables the native range input.')
      ],
      'Native range attributes such as name and onchange are forwarded.'
    )
  ],
  '/docs/components/status-bar/': [
    props(
      [
        row('label', 'string', "'Service'", 'Service label.'),
        row('items', 'StatusItem[]', '[]', 'Historical status points.'),
        row('descriptions', 'Record<Status, string>', '{}', 'Fallback description by status.'),
        row('total', 'number', 'items.length', 'Requested number of visible periods.'),
        row('status', 'Status', 'last item', 'Current status override.'),
        row('statusLabel', 'string', 'derived', 'Current status label override.'),
        row('startLabel', 'string', 'derived', 'Range start label.'),
        row('endLabel', 'string', "'Today'", 'Range end label.'),
        row('tooltipPlacement', "'top' | 'bottom'", "'top'", 'Tooltip placement.'),
        row('tooltip', 'Snippet<TooltipContext>', '-', 'Custom tooltip renderer.')
      ],
      'Status is operational, degraded, outage, maintenance, or unknown.'
    )
  ],
  '/docs/components/switch/': [
    props(
      [
        row('checked', 'boolean', 'false', 'Bindable checked state.'),
        row('label', 'string', '-', 'Visible setting label.'),
        row('description', 'string', '-', 'Supporting copy.'),
        row('disabled', 'boolean', 'false', 'Disables the native checkbox.')
      ],
      'Native input attributes such as name, value, required, and onchange are forwarded.'
    )
  ],
  '/docs/components/table/': {
    svelte: [
      props(
        [
          row('columns', 'TableColumn[]', '[]', 'Column definitions.'),
          row('rows', 'Record<string, unknown>[]', '[]', 'Table records.'),
          row('caption', 'string', '-', 'Accessible table caption.'),
          row('showHeader', 'boolean', 'true', 'Shows the column header row.'),
          row('variant', "'default' | 'striped' | 'minimal'", "'default'", 'Table treatment.'),
          row('density', "'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'default' | 'compact'", "'default'", 'Header and row size. default = lg; compact = sm.'),
          row('layout', "'auto' | 'fixed'", "'auto'", 'Fixed layout keeps column widths stable as rows reorder.'),
          row('cell', 'Snippet<{ row, column, value }>', '-', 'Custom cell renderer.'),
          row('rowActions', 'Snippet<{ row, index }>', '-', 'Actions in a dedicated trailing column.'),
          row('copyable', 'boolean', 'false', 'Adds a copy action to each row.'),
          row('copyColumn', 'string', 'last column', 'Row field copied by default.'),
          row('getCopyValue', '(row) => string | null', '-', 'Custom per-row copy value.'),
          row('copyLabel', 'string', "'Copy value'", 'Accessible copy-button label.'),
          row('selectable', 'boolean', 'false', 'Adds row and current-page selection controls.'),
          row('selected', 'unknown[]', '[]', 'Bindable selected row keys.', ['bindable']),
          row('rowKey', 'string', "'id'", 'Field used as the stable row key.'),
          row('getRowKey', '(row, index) => unknown', '-', 'Custom row-key resolver.'),
          row('selectionLabel', 'string', "'Select row'", 'Accessible prefix for row selection controls.'),
          row('onselectionchange', '(keys) => void', '-', 'Runs whenever row selection changes.')
        ],
        'Column definitions support key, label, width, align, rowHeader, displayKey, optional cell snippets, linkKey, and avatar field mappings.'
      )
    ],
    html: [
      props(
        [
          row('columns', 'JSON array', '[]', 'Column definitions.'),
          row('rows', 'JSON array', '[]', 'Table records.'),
          row('caption', 'string', '-', 'Accessible table caption.'),
          row('show-header', 'boolean', 'true', 'Shows the column header row.'),
          row('hide-header', 'boolean', 'false', 'Hides the column header row.'),
          row('variant', "'default' | 'striped' | 'minimal'", "'default'", 'Table treatment.'),
          row('density', "'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'default' | 'compact'", "'default'", 'Header and row size. default = lg; compact = sm.'),
          row('layout', "'auto' | 'fixed'", "'auto'", 'Fixed layout keeps column widths stable as rows reorder.'),
          row('copyable', 'boolean', 'false', 'Adds a copy action to each row.'),
          row('copy-column', 'string', 'last column', 'Row field copied by default.'),
          row('copy-label', 'string', "'Copy value'", 'Accessible copy-button label.'),
          row('selectable', 'boolean', 'false', 'Adds row and current-page selection controls.'),
          row('selected', 'array', '[]', 'Selected row keys.'),
          row('row-key', 'string', "'id'", 'Field used as the stable row key.'),
          row('selection-label', 'string', "'Select row'", 'Accessible prefix for row selection controls.'),
          row('sort-key', 'string', '-', 'Currently sorted column key.'),
          row('sort-direction', "'ascending' | 'descending'", "'ascending'", 'Current sort direction.'),
          row('selectionchange', 'CustomEvent', '-', 'Emitted with selected keys in detail.value.'),
          row('sortchange', 'CustomEvent', '-', 'Emitted with the next sort key and direction.')
        ],
        'Set columns, rows, and selected from JavaScript or provide them as JSON attributes.'
      )
    ]
  },
  '/docs/components/tabs/': [
    props(
      [
        row('items', 'TabItem[]', '[]', 'Tabs with value, label, optional content, and disabled.'),
        row('value', 'unknown', 'first enabled item', 'Bindable active tab value.'),
        row('size', "'default' | 'sm'", "'default'", 'Tab-list density.'),
        row('variant', "'default' | 'line'", "'default'", 'Tab-list treatment.'),
        row('width', "'default' | 'full'", "'default'", 'Content-sized or full-width tab list. Full-width tabs share the available space equally.'),
        row('border', 'boolean', 'false', 'Adds an outline to the default list or extends the line-variant separator.'),
        row('label', 'string', "'Tabs'", 'Accessible tab-list label.')
      ],
      'Additional attributes are forwarded to the tabs container.'
    )
  ],
  '/docs/components/toast/': [
    {
      title: 'Toast Options',
      rows: [
        row('title', 'string', 'required', 'Primary notification message.'),
        row('description', 'string', '-', 'Supporting message.'),
        row('variant', "'default' | 'info' | 'success' | 'warning' | 'destructive' | 'loading'", "'default'", 'Semantic state.'),
        row(
          'duration',
          'number',
          '4000 / 0',
          'Auto-dismiss delay in milliseconds. Errors and toasts with actions persist by default; 0 disables dismissal. An explicit duration overrides the default.'
        ),
        row('action', '{ label, onClick, dismiss? }', '-', 'Optional compact action.')
      ]
    },
    {
      title: 'Toast Methods',
      rows: [
        row('toast(options)', 'function', '-', 'Creates a toast and returns its id.'),
        row('toast.success/info/warning/error', 'function', '-', 'Creates a semantic toast.'),
        row('toast.loading', 'function', '-', 'Creates a persistent loading toast.'),
        row('toast.promise', 'function', '-', 'Updates one toast across loading, success, and error.'),
        row('toast.update', 'function', '-', 'Updates an existing toast by id.'),
        row('toast.dismiss', 'function', '-', 'Dismisses a toast by id.')
      ],
      note: 'Mount one AesirToaster in the root layout.'
    },
    {
      title: 'Toaster Props',
      rows: [row('class', 'string', "''", 'Class applied to the portal toaster root.'), row('style', 'string', '-', 'Inline style applied to the portal toaster root.')]
    }
  ],
  '/docs/components/textarea/': [
    props(
      [
        row('value', 'string', "''", 'Bindable textarea value.'),
        row('label', 'string', '-', 'Visible field label.'),
        row('description', 'string', '-', 'Supporting copy.'),
        row('error', 'string', '-', 'Validation message and invalid state.'),
        row('errorPlacement', "'message' | 'label'", "'message'", 'Places validation below the field or beside its label.'),
        row('size', "'sm' | 'default' | 'lg'", "'default'", 'Text and padding density.'),
        row('resize', "'vertical' | 'none' | 'auto'", "'vertical'", 'Native vertical resize, fixed height, or automatic growth.'),
        row('rows', 'number', '4', 'Initial native textarea rows.'),
        row('maxlength', 'number', '-', 'Native maximum character count.'),
        row('showCount', 'boolean', 'false', 'Shows the current character count.'),
        row('disabled', 'boolean', 'false', 'Disables the native textarea.'),
        row('optional', 'boolean', 'false', 'Adds a quiet optional suffix.'),
        row('required', 'boolean', 'false', 'Enables native required validation.'),
        row('reserveMessageSpace', 'boolean', 'false', 'Keeps a support row for aligned field layouts.')
      ],
      'Native textarea attributes such as name, autocomplete, placeholder, minlength, and onchange are forwarded.'
    )
  ],
  '/docs/components/tooltip/': [
    props(
      [
        row('content', 'string | Snippet', 'required', 'Short supplementary text.'),
        row('placement', "'top' | 'bottom'", "'top'", 'Preferred placement.'),
        row('offset', 'number', '8', 'Distance from the trigger in pixels.'),
        row('delay', 'number', '250', 'Initial hover delay in milliseconds.'),
        row('contentClass', 'string', "''", 'Class applied to the portal tooltip panel.'),
        row('contentStyle', 'string', '-', 'Inline style applied to the portal tooltip panel.'),
        row('trigger', 'Snippet<TriggerProps>', 'required', 'Trigger receiving hover, focus, and ARIA props.')
      ],
      'Class, style, and additional attributes are forwarded to the trigger root.'
    )
  ]
};
