"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import type { Thread } from "./comments";
import { WorkingSheet } from "./WorkingSheet";
import type { BoardItem, Stroke } from "./types";

// A working sheet that lives inside a page as a block: an infinite canvas with
// images, notes, swatches, shapes, text, ink and comment pins.

function WorkingSheetView({ node, updateAttributes, editor, deleteNode }: NodeViewProps) {
  return (
    <NodeViewWrapper className="my-6" contentEditable={false}>
      <WorkingSheet
        items={node.attrs.items ?? []}
        strokes={node.attrs.strokes ?? []}
        threads={node.attrs.threads ?? []}
        height={node.attrs.height ?? 520}
        editor={editor}
        update={(patch) => updateAttributes(patch)}
        onDelete={deleteNode}
      />
    </NodeViewWrapper>
  );
}

export const WorkingSheetNode = Node.create({
  name: "workingSheet",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      items: {
        default: [] as BoardItem[],
        parseHTML: (el) => {
          try {
            return JSON.parse(el.getAttribute("data-items") ?? "[]");
          } catch {
            return [];
          }
        },
        renderHTML: (attrs) => ({ "data-items": JSON.stringify(attrs.items ?? []) }),
      },
      height: { default: 520 },
      strokes: { default: [] as Stroke[] },
      threads: { default: [] as Thread[] },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="working-sheet"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "working-sheet" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WorkingSheetView);
  },
});
