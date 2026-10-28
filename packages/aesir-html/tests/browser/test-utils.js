export async function mount(markup) {
  document.body.innerHTML = markup;
  await Promise.all([...document.querySelectorAll('*')].filter((element) => element.localName.includes('-')).map((element) => customElements.whenDefined(element.localName)));
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}
