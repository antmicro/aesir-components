import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/svelte';
import { parse } from 'svelte/compiler';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';
import Loader from '../src/components/aesir-loader/aesir-loader.svelte';

const loaderPath = resolve(process.cwd(), 'src/components/aesir-loader/aesir-loader.svelte');

const literalOptions = (name) => {
  const source = readFileSync(loaderPath, 'utf8');
  const script = parse(source).instance.content;
  const types = ts.createSourceFile('loader.ts', source.slice(script.start, script.end), ts.ScriptTarget.Latest, true);
  const props = types.statements.find((statement) => ts.isTypeAliasDeclaration(statement) && statement.name.text === 'LoaderProps');
  const ownProps = props.type.types.find(ts.isTypeLiteralNode);
  const property = ownProps.members.find((member) => ts.isPropertySignature(member) && member.name.getText(types) === name);
  const options = ts.isUnionTypeNode(property.type) ? property.type.types : [property.type];
  return options.map((option) => option.literal.text);
};

describe('AesirLoader variants', () => {
  test.each([
    ['ring', '.aesir-loader__ring'],
    ['lines', '.aesir-loader__lines'],
    ['grid', '.aesir-loader__grid']
  ])('%s renders its visual treatment', (variant, selector) => {
    const { container } = render(Loader, { variant });
    expect(container.querySelector(selector)).toBeTruthy();
  });

  test('typed choices match the supported visual variants and grid patterns', () => {
    expect(literalOptions('variant').sort()).toEqual(['grid', 'lines', 'ring']);
    expect(literalOptions('pattern').sort()).toEqual(['orbit', 'pulse', 'wave']);
  });
});
