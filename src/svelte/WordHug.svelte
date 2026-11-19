<!--
  Renders `text` so that every [bracketed phrase] is wrapped in an element
  (an inline-block span by default) that moves to the next line as one unit.
-->
<script>
  import { parseBrackets } from "wordhug";

  /** @type {import("./index").WordHugProps} */
  let { text, as = "span", class: className, style = "display: inline-block" } = $props();

  const nodes = $derived(text ? parseBrackets(text) : []);
</script>

<!-- Kept on one line: whitespace between these tags would show up in the output. -->
{#snippet render(/** @type {import("wordhug").Node[]} */ list)}{#each list as node}{#if node.type === "text"}{node.value}{:else}<svelte:element this={as} class={className} style={style ?? undefined}>{@render render(node.children)}</svelte:element>{/if}{/each}{/snippet}

{@render render(nodes)}
