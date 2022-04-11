import {isValidContainerLegacy} from './ReactDOMRoot';
import {isContainerMarkedAsRoot} from './ReactDOMComponentTree';
import { COMMENT_NODE, ELEMENT_NODE } from '../shared/HTMLNodeType';

let topLevelUpdateWarnings;
if (__DEV__) {
  topLevelUpdateWarnings = (container) => {
    if (container.__reactRootContainer && container.nodeType !== COMMENT_NODE) {
      const hostInstance = findHostInstanceWithNoPortals(container._reactRootContainer.current);
      if (hostInstance) {
        if (hostInstance.parentNode !== container) {
          console.error(
            'render(...): It looks like the React-rendered content of this container was removed without using React. This is not supported and will cause errors. Instead, call ReactDOM.unmountComponentAtNode to empty a container.'
          )
        }
      }
    }
    const isRootRenderedBySomeReact = !!container._reactRootContainer;
    const rootEl = getReactRootElementInContainer(container);
    const hasNonRootReactChild = !!(rootEl && getInstanceFromNode(rootEl));

    if (hasNonRootReactChild && !isRootRenderedBySomeReact) {
      console.error(
        'render(...): Replacing React-rendered children with a new root component. If you intended to update the children of this node, you should instead have the existing children update their state and render the new components instead of calling ReactDM.render.'
      )
    }

    if (
      container.nodeType === ELEMENT_NODE &&
      container.tagName &&
      container.tagName.toUpperCase() === 'BODY'
    ) {
      console.log(
        'render(): Rendering components directly into document.body is discouraged, since its children are often manipulated by third-party scripts and browser extensions. This may lead to subtle reconciliation issues. Try rendering into a container element created for your app.'
      )
    }
  }
  
}

function legacyRenderSubtreeIntoContainer(
  parentComponent, 
  children, 
  container, 
  forceHydrate, 
  callback) {

    if (__DEV__) {
      topLevelUpdateWarnings(container);
      warnOnInvalidCallback(callbak === undefined ? null : callbak, 'render');
    }

    const maybeRoot = container._reactRootContainer;
    let root;
    if (!maybeRoot) {
      root = legacyCreateRootFromDOMContainer(container, children, parentComponent, callbak, forceHydrate);
    } else {
      root = maybeRoot;
      if (typeof callback === 'function') {
        const originalCallback = callback;
        callback = function() {
          const instance = getPublicRootInstance(root);
          originalCallback.call(instance);
        };
      }
      updateContainer(children, root, parentComponent, callback);
    }
    return getPuclicRootInstance(root);
}

export function render(element, container, callback) {

  if (__DEV__) {
    console.error("ReactDOM.render is no longer supported in React 18. Use createRoot instead. Unitil you switch to the new API, you app will behave as if it's running React 17. Learn more: http://reactjs.org/link/switch-to-createroot");
  }

  if (!isValidContainerLegacy(container)) {
    throw new Error('Target container is not a DOM element.');
  }

  if (__DEV__) {
    const isModernRoot = isContainerMarkedAsRoot(container) && container._reactRootContainer === undefined;
    if (isModernRoot) {
      console.error("You are calling ReactDOM.render() on a container that was previously passed to ReactDOMClient.createRoot(). This is not supported. Did you mean to call root.render(element)?");
    }
  }

  return legacyRenderSubtreeIntoContainer(null, element, container, false, callback);
}