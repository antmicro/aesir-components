<script>
  import { AesirButton, AesirDropdown, AesirIcon, AesirInput, AesirQuantityStepper } from '@aesir/svelte';

  const countries = [
    { label: 'Poland', value: 'pl' },
    { label: 'Germany', value: 'de' },
    { label: 'United Kingdom', value: 'gb' },
    { label: 'United States', value: 'us' }
  ];

  let items = $state([
    { id: 'baseboard', name: 'Antmicro Baseboard', details: 'Jetson Orin · rev. 1.3.4', price: 499, quantity: 1, icon: 'package' },
    { id: 'debug-cable', name: 'USB-C debug cable', details: '1 m · USB 3.2', price: 29, quantity: 2, icon: 'package' }
  ]);
  let values = $state({ fullName: '', email: '', address: '', postalCode: '', city: '', cardNumber: '', expiration: '', securityCode: '', vatNumber: '' });
  let touched = $state({});
  let shippingCountry = $state('');
  let shippingCountryOpen = $state(false);
  let shippingCountryWasOpened = false;
  let companyCountry = $state('pl');
  const shipping = $derived(items.length ? 15 : 0);
  const vatRate = 0.23;
  const subtotal = $derived(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const netTotal = $derived(subtotal + shipping);
  const vat = $derived(netTotal * vatRate);
  const total = $derived(netTotal + vat);
  const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const countryLabel = (value) => countries.find((country) => country.value === value)?.label;
  const countryItems = (value) => countries.map((country) => ({ ...country, role: 'menuitemradio', checked: country.value === value }));

  const requiredMessage = (value) => (value.trim() ? undefined : 'Required');
  const errorPlacementFor = (value) => (value.trim() ? 'message' : 'label');
  const emailMessage = (value) => {
    if (!value.trim()) return 'Required';
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Enter a valid email address.';
  };
  const postalCodeMessage = (value) => {
    if (!value.trim()) return 'Required';
    return /^[A-Za-z0-9 -]{3,16}$/.test(value) ? undefined : 'Enter a valid postal code.';
  };
  const isValidPolishNip = (digits) => {
    if (!/^\d{10}$/.test(digits)) return false;
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const checksum = weights.reduce((sum, weight, index) => sum + weight * Number(digits[index]), 0) % 11;
    return checksum !== 10 && checksum === Number(digits[9]);
  };
  const vatNumberMessage = (value, countryCode) => {
    const normalized = value.toUpperCase().replace(/[\s.-]/g, '');
    if (!normalized) return undefined;

    if (countryCode === 'pl') {
      const digits = normalized.replace(/^PL/, '');
      return isValidPolishNip(digits) ? undefined : 'Enter a valid Polish NIP.';
    }
    if (countryCode === 'de') return /^(DE)?\d{9}$/.test(normalized) ? undefined : 'Use DE followed by 9 digits.';
    if (countryCode === 'gb') return /^(GB)?(?:\d{9}|\d{12})$/.test(normalized) ? undefined : 'Use GB followed by 9 or 12 digits.';
    if (countryCode === 'us') return /^\d{9}$/.test(normalized) ? undefined : 'Enter a 9-digit tax ID.';
    return undefined;
  };

  const errorFor = (field, validator) => (touched[field] ? validator(values[field]) : undefined);
  const fullNameError = $derived(errorFor('fullName', requiredMessage));
  const emailError = $derived(errorFor('email', emailMessage));
  const addressError = $derived(errorFor('address', requiredMessage));
  const postalCodeError = $derived(errorFor('postalCode', postalCodeMessage));
  const cityError = $derived(errorFor('city', requiredMessage));
  const shippingCountryError = $derived(touched.shippingCountry && !shippingCountry ? 'Required' : undefined);
  const vatError = $derived(touched.vatNumber ? vatNumberMessage(values.vatNumber, companyCountry) : undefined);

  const cardNumberMessage = (value) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return 'Required';
    if (digits.length !== 16) return 'Card number must contain 16 digits.';

    const checksum = digits
      .split('')
      .reverse()
      .reduce((sum, digit, index) => {
        let number = Number(digit);
        if (index % 2 === 1) {
          number *= 2;
          if (number > 9) number -= 9;
        }
        return sum + number;
      }, 0);

    return checksum % 10 === 0 ? undefined : 'Enter a valid card number.';
  };

  const expirationDateMessage = (value) => {
    const match = /^(0[1-9]|1[0-2]) \/ (\d{2})$/.exec(value);
    if (!value) return 'Required';
    if (!match) return 'Use a valid date in MM / YY format.';

    const now = new Date();
    const expirationMonth = Number(match[1]);
    const expirationYear = 2000 + Number(match[2]);
    if (expirationYear < now.getFullYear() || (expirationYear === now.getFullYear() && expirationMonth < now.getMonth() + 1)) {
      return 'This card has expired.';
    }

    return undefined;
  };

  const securityCodeMessage = (value) => {
    if (!value) return 'Required';
    return /^\d{3,4}$/.test(value) ? undefined : 'Security code must contain 3 or 4 digits.';
  };

  const cardError = $derived(errorFor('cardNumber', cardNumberMessage));
  const expirationError = $derived(errorFor('expiration', expirationDateMessage));
  const securityCodeError = $derived(errorFor('securityCode', securityCodeMessage));

  $effect(() => {
    if (shippingCountryOpen) {
      shippingCountryWasOpened = true;
      return;
    }
    if (!shippingCountryWasOpened) return;
    shippingCountryWasOpened = false;
    setTouched('shippingCountry');
  });

  const updateFormatted = (event, field, format) => {
    const input = event.currentTarget;
    touched[field] = false;
    values[field] = format(input.value);
    input.value = values[field];
  };
  const cardFormat = (value) =>
    value
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ');
  const expirationFormat = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
  };
  const securityCodeFormat = (value) => value.replace(/\D/g, '').slice(0, 4);
  const vatFormat = (value) =>
    value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 14);
  const setTouched = (field, value = true) => (touched[field] = value);
  const removeItem = (id) => (items = items.filter((item) => item.id !== id));

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    for (const field of ['fullName', 'email', 'address', 'postalCode', 'city', 'shippingCountry', 'cardNumber', 'expiration', 'securityCode']) setTouched(field);
    if (values.vatNumber) setTouched('vatNumber');
    queueMicrotask(() => form.querySelector('[aria-invalid="true"]')?.focus());
  };
</script>

<div class="checkout-pattern">
  <form id="checkout-demo-form" class="checkout-form" autocomplete="on" novalidate onsubmit={handleSubmit}>
    <section class="checkout-section" aria-labelledby="shipping-heading">
      <h2 id="shipping-heading">Shipping details</h2>
      <div class="checkout-fields">
        <AesirInput
          class="checkout-field--wide"
          name="name"
          label="Full name"
          bind:value={values.fullName}
          error={fullNameError}
          errorPlacement={errorPlacementFor(values.fullName)}
          autocomplete="name"
          required
          maxlength="100"
          placeholder="Jan Kowalski"
          oninput={() => setTouched('fullName', false)}
          onblur={() => setTouched('fullName')}
        />
        <AesirInput
          class="checkout-field--wide"
          name="email"
          label="Email"
          bind:value={values.email}
          error={emailError}
          errorPlacement={errorPlacementFor(values.email)}
          type="email"
          autocomplete="email"
          required
          maxlength="254"
          placeholder="jan@example.com"
          oninput={() => setTouched('email', false)}
          onblur={() => setTouched('email')}
        />
        <AesirInput
          class="checkout-field--wide"
          name="address-line1"
          label="Address"
          bind:value={values.address}
          error={addressError}
          errorPlacement={errorPlacementFor(values.address)}
          autocomplete="address-line1"
          required
          maxlength="120"
          placeholder="Street and house number"
          oninput={() => setTouched('address', false)}
          onblur={() => setTouched('address')}
        />
        <AesirInput class="checkout-field--wide" name="address-line2" label="Address line 2" optional autocomplete="address-line2" maxlength="120" placeholder="Apartment, suite, etc." />
        <AesirInput
          name="postal-code"
          label="Postal code"
          bind:value={values.postalCode}
          error={postalCodeError}
          errorPlacement={errorPlacementFor(values.postalCode)}
          reserveMessageSpace
          autocomplete="postal-code"
          required
          minlength="3"
          maxlength="16"
          pattern={'[A-Za-z0-9 -]{3,16}'}
          placeholder="00-001"
          oninput={() => setTouched('postalCode', false)}
          onblur={() => setTouched('postalCode')}
        />
        <AesirInput
          name="address-level2"
          label="City"
          bind:value={values.city}
          error={cityError}
          errorPlacement={errorPlacementFor(values.city)}
          reserveMessageSpace
          autocomplete="address-level2"
          required
          maxlength="80"
          placeholder="Warsaw"
          oninput={() => setTouched('city', false)}
          onblur={() => setTouched('city')}
        />
        <div class="checkout-country checkout-field--wide">
          <span>
            Country
            {#if shippingCountryError}<small id="shipping-country-error" class="checkout-country__error" aria-live="polite">Required</small>{/if}
          </span>
          <AesirDropdown bind:open={shippingCountryOpen} items={countryItems(shippingCountry)} error={shippingCountryError} matchTriggerWidth onselect={(item) => (shippingCountry = item.value)}>
            {#snippet trigger(props)}
              <AesirButton
                class="checkout-country__trigger"
                variant="outline"
                data-placeholder={!shippingCountry || undefined}
                {...props}
                aria-describedby={shippingCountryError ? 'shipping-country-error' : undefined}
              >
                {countryLabel(shippingCountry) ?? 'Select a country'}
                <AesirIcon name="chevron-down" />
              </AesirButton>
            {/snippet}
          </AesirDropdown>
          <input type="hidden" name="country" value={shippingCountry} autocomplete="country" />
        </div>
      </div>
    </section>

    <section class="checkout-section" aria-labelledby="payment-heading">
      <h2 id="payment-heading">Payment</h2>
      <div class="checkout-fields">
        <AesirInput
          class="checkout-field--wide"
          name="cc-number"
          label="Card number"
          bind:value={values.cardNumber}
          error={cardError}
          errorPlacement={errorPlacementFor(values.cardNumber)}
          inputmode="numeric"
          autocomplete="cc-number"
          required
          minlength="19"
          maxlength="19"
          pattern="[0-9]{4}( [0-9]{4}){3}"
          placeholder="1234 1234 1234 1234"
          oninput={(event) => updateFormatted(event, 'cardNumber', cardFormat)}
          onblur={() => setTouched('cardNumber')}
        />
        <AesirInput
          name="cc-exp"
          label="Expiration date"
          bind:value={values.expiration}
          error={expirationError}
          errorPlacement={errorPlacementFor(values.expiration)}
          reserveMessageSpace
          inputmode="numeric"
          autocomplete="cc-exp"
          required
          maxlength="7"
          pattern="(0[1-9]|1[0-2]) / [0-9]{2}"
          placeholder="MM / YY"
          oninput={(event) => updateFormatted(event, 'expiration', expirationFormat)}
          onblur={() => setTouched('expiration')}
        />
        <AesirInput
          name="cc-csc"
          label="Security code"
          bind:value={values.securityCode}
          error={securityCodeError}
          errorPlacement={errorPlacementFor(values.securityCode)}
          reserveMessageSpace
          inputmode="numeric"
          autocomplete="cc-csc"
          required
          minlength="3"
          maxlength="4"
          pattern={'[0-9]{3,4}'}
          placeholder="CVC"
          oninput={(event) => updateFormatted(event, 'securityCode', securityCodeFormat)}
          onblur={() => setTouched('securityCode')}
        >
          {#snippet trailing()}<AesirIcon name="ShieldCheck" />{/snippet}
        </AesirInput>
      </div>
    </section>

    <section class="checkout-section checkout-section--last" aria-labelledby="company-heading">
      <h2 id="company-heading">
        Company information <span>(optional)</span>
      </h2>
      <div class="checkout-fields">
        <AesirInput class="checkout-field--wide" name="organization" label="Company name" optional autocomplete="organization" maxlength="120" />
        <AesirInput
          class="checkout-field--wide"
          name="vat-number"
          label={companyCountry === 'us' ? 'Tax ID' : 'VAT number'}
          optional
          bind:value={values.vatNumber}
          error={vatError}
          errorPlacement="message"
          inputmode="text"
          maxlength="14"
          placeholder={companyCountry === 'pl' ? 'PL7811886780' : undefined}
          oninput={(event) => updateFormatted(event, 'vatNumber', vatFormat)}
          onblur={() => setTouched('vatNumber')}
        />
        <AesirInput class="checkout-field--wide" name="company-address-line1" label="Address" optional autocomplete="billing address-line1" maxlength="120" placeholder="Street and house number" />
        <AesirInput
          class="checkout-field--wide"
          name="company-address-line2"
          label="Address line 2"
          optional
          autocomplete="billing address-line2"
          maxlength="120"
          placeholder="Apartment, suite, etc."
        />
        <AesirInput name="company-postal-code" label="Postal code" optional autocomplete="billing postal-code" maxlength="16" placeholder="00-001" />
        <AesirInput name="company-city" label="City" optional autocomplete="billing address-level2" maxlength="80" placeholder="Warsaw" />
        <div class="checkout-country checkout-field--wide">
          <span>
            Country <small>(optional)</small>
          </span>
          <AesirDropdown items={countryItems(companyCountry)} matchTriggerWidth onselect={(item) => (companyCountry = item.value)}>
            {#snippet trigger(props)}
              <AesirButton class="checkout-country__trigger" variant="outline" {...props}>{countryLabel(companyCountry)} <AesirIcon name="chevron-down" /></AesirButton>
            {/snippet}
          </AesirDropdown>
          <input type="hidden" name="company-country" value={companyCountry} autocomplete="billing country" />
        </div>
      </div>
    </section>
  </form>

  <aside class="checkout-summary" aria-labelledby="summary-heading">
    <h2 id="summary-heading">Order summary</h2>
    <div class="checkout-summary__content">
      <div class="checkout-products">
        {#each items as item (item.id)}
          <div class="checkout-product">
            <span class="checkout-product__image" aria-hidden="true"><AesirIcon name={item.icon} /></span>
            <div class="checkout-product__copy">
              <div class="checkout-product__heading">
                <strong>{item.name}</strong>
                <strong title={money(item.price * item.quantity)}>{money(item.price * item.quantity)}</strong>
              </div>
              <span>{item.details}</span>
              <div class="checkout-product__quantity">
                <div class="checkout-product__actions">
                  <AesirButton class="checkout-product__remove" variant="ghost" size="icon-sm" aria-label={`Remove ${item.name}`} title="Remove product" onclick={() => removeItem(item.id)}>
                    <AesirIcon name="Trash2" />
                  </AesirButton>
                  <AesirQuantityStepper bind:value={item.quantity} max={99} label={`Quantity for ${item.name}`} />
                </div>
              </div>
            </div>
          </div>
        {:else}
          <p class="checkout-products__empty">Your cart is empty.</p>
        {/each}
      </div>

      <dl class="checkout-totals">
        <div>
          <dt>Subtotal</dt>
          <dd title={money(subtotal)}>{money(subtotal)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{money(shipping)}</dd>
        </div>
        <div>
          <dt>VAT (23%)</dt>
          <dd title={money(vat)}>{money(vat)}</dd>
        </div>
        <div class="checkout-total">
          <dt>Total</dt>
          <dd title={money(total)}>{money(total)}</dd>
        </div>
      </dl>

      <AesirButton type="submit" form="checkout-demo-form" variant="accent" width="full" disabled={!items.length}>Place order <AesirIcon name="ArrowRight" /></AesirButton>
    </div>
    <p class="checkout-terms">By placing your order, you agree to the terms of sale and privacy policy.</p>
  </aside>
</div>

<style>
  .checkout-pattern {
    display: grid;
    width: 100%;
    grid-template-columns: minmax(0, 1fr) minmax(15rem, 22rem);
    align-items: start;
    gap: clamp(var(--ds-spacing-5), 3vw, var(--ds-spacing-10));
    font-family: var(--ds-font-family-sans);
  }

  .checkout-form {
    min-width: 0;
  }

  .checkout-section h2,
  .checkout-terms {
    margin: 0;
  }

  .checkout-section {
    padding-block: var(--ds-spacing-8);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
  }

  .checkout-section:first-child {
    padding-top: 0;
    border-top: 0;
  }

  .checkout-section h2 {
    margin-bottom: var(--ds-spacing-6);
    padding-top: 0;
    font-size: var(--ds-font-size-lg);
    line-height: var(--ds-font-line-height-lg);
  }

  .checkout-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--ds-spacing-4);
  }

  :global(.checkout-field--wide) {
    grid-column: 1 / -1;
  }

  .checkout-section h2 span {
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-normal);
  }

  .checkout-country {
    display: grid;
    gap: var(--ds-spacing-1-5);
  }

  .checkout-country > span {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-spacing-3);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
  }

  .checkout-country small {
    color: var(--ds-foreground-muted);
    font: inherit;
    font-weight: var(--ds-font-weight-normal);
  }

  .checkout-country .checkout-country__error {
    color: var(--ds-foreground-red);
    font-size: var(--ds-font-size-xxs);
    font-weight: var(--ds-font-weight-medium);
    letter-spacing: 0.04em;
    line-height: var(--ds-font-line-height-xs);
    text-transform: uppercase;
  }

  .checkout-country :global(.aesir-dropdown__anchor),
  .checkout-country :global(.checkout-country__trigger) {
    width: 100%;
  }

  .checkout-country :global(.checkout-country__trigger[data-placeholder]) {
    color: var(--ds-foreground-muted);
  }

  .checkout-country :global(.checkout-country__trigger) {
    height: var(--ds-spacing-10);
    justify-content: space-between;
  }

  .checkout-summary {
    position: sticky;
    top: 0;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--ds-radius-xl);
    background: var(--ds-background-secondary);
  }

  .checkout-summary h2 {
    margin: 0 0 var(--ds-spacing-5);
    padding-top: 0;
    font-size: var(--ds-font-size-lg);
    line-height: var(--ds-font-line-height-lg);
  }

  .checkout-summary__content {
    display: grid;
    gap: var(--ds-spacing-5);
  }

  .checkout-products {
    display: grid;
  }

  .checkout-product {
    display: grid;
    grid-template-columns: var(--ds-spacing-12) minmax(0, 1fr);
    align-items: start;
    gap: var(--ds-spacing-3);
    padding-block: var(--ds-spacing-4);
    border-bottom: var(--ds-spacing-px) solid var(--ds-border);
  }

  .checkout-product:first-child {
    padding-top: 0;
  }

  .checkout-product__image {
    display: grid;
    width: var(--ds-spacing-12);
    height: var(--ds-spacing-12);
    place-items: center;
    border: var(--ds-spacing-px) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    background: var(--ds-surface);
    color: var(--ds-foreground-muted);
  }

  .checkout-product__image :global(svg) {
    width: var(--ds-spacing-5);
    height: var(--ds-spacing-5);
  }

  .checkout-product__copy {
    display: grid;
    min-width: 0;
    gap: var(--ds-spacing-1);
  }

  .checkout-product__heading,
  .checkout-product__quantity {
    display: flex;
    gap: var(--ds-spacing-2);
  }

  .checkout-product__actions {
    display: flex;
    align-items: center;
    gap: var(--ds-spacing-1);
  }

  :global(.checkout-product__remove) {
    color: var(--ds-foreground-muted);
  }

  :global(.checkout-product__remove:hover),
  :global(.checkout-product__remove:focus-visible) {
    color: var(--ds-foreground-red);
  }

  .checkout-product__heading {
    align-items: flex-start;
    justify-content: space-between;
  }

  .checkout-product__quantity {
    align-items: center;
    justify-content: flex-end;
    margin-top: var(--ds-spacing-2);
  }

  .checkout-product__heading strong:first-child {
    min-width: 0;
  }

  .checkout-product__heading strong:last-child {
    min-width: 0;
    max-width: 55%;
    overflow: hidden;
    flex: 0 1 auto;
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .checkout-product__copy strong {
    margin: 0;
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-font-line-height-sm);
  }

  .checkout-product__copy > span {
    overflow: hidden;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-xs);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .checkout-totals {
    display: grid;
    gap: var(--ds-spacing-3);
    margin: 0;
  }

  .checkout-products__empty {
    margin: 0;
    padding-block: var(--ds-spacing-4);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }

  .checkout-totals div {
    display: flex;
    justify-content: space-between;
    gap: var(--ds-spacing-6);
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-sm);
  }

  .checkout-totals dd {
    min-width: 0;
    max-width: 70%;
    overflow: hidden;
    margin: 0;
    color: var(--ds-foreground);
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .checkout-totals .checkout-total {
    margin-top: var(--ds-spacing-1);
    padding-top: var(--ds-spacing-4);
    border-top: var(--ds-spacing-px) solid var(--ds-border);
    color: var(--ds-foreground);
    font-size: var(--ds-font-size-base);
    font-weight: var(--ds-font-weight-medium);
  }

  .checkout-terms {
    padding: var(--ds-spacing-3) var(--ds-spacing-4) 0;
    color: var(--ds-foreground-muted);
    font-size: var(--ds-font-size-xs);
    line-height: var(--ds-font-line-height-sm);
    text-align: center;
  }

  @container (max-width: 34rem) {
    .checkout-pattern {
      grid-template-columns: 1fr;
    }

    .checkout-summary {
      position: static;
    }
  }

  @container (max-width: 30rem) {
    .checkout-fields {
      grid-template-columns: 1fr;
    }

    :global(.checkout-field--wide) {
      grid-column: auto;
    }
  }
</style>
