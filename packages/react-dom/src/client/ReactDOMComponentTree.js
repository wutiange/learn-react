

const randomKey = Math.random().toString(36).slice(2);
const internalContainerInstanceKey = '__reactContainer$' + randomKey;

export function isContainerMarkedAsRoot(node) {
  return !!node[internalContainerInstanceKey];
}