let currentlyRenderingComponent = null
let workInProgressHook = null;
let firstWorkInProgressHook = null;
let didScheduleRenderPhaseUpdate = false;
let isReRender = false;
let renderPhaseUpdates = null;
let numberOfReRenders = 0;
const RE_RENDER_LIMIT = 25;
let isInHookUserCodeInDev = false;

let currentHookNameInDev;

function resolveCurrentlyRenderingComponent() {
  invariant(
    currentlyRenderingComponent !== null,
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
      ' one of the following reasons:\n' +
      '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
      '2. You might be breaking the Rules of Hooks\n' +
      '3. You might have more than one copy of React in the same app\n' +
      'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
  );
  if (__DEV__) {
    if (isInHookUserCodeInDev) {
      console.error(
        'Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. ' +
          'You can only call Hooks at the top level of your React function. ' +
          'For more information, see ' +
          'https://reactjs.org/link/rules-of-hooks',
      );
    }
  }
  return currentlyRenderingComponent;
}

function createHook() {
  if (numberOfReRenders > 0) {
    invariant(false, 'Rendered more hooks than during the previous render');
  }
  return {
    memoizedState: null,
    queue: null;
    next: null;
  };
}
function createWorkInProgressHook() {
  if (workInProgressHook === null) {
    if (firstWorkInProgressHook === null) {
      isReRender = false;
      firstWorkInProgressHook = workInProgressHook = createHook();
    } else {
      isReRender = true;
      workInProgressHook = firstWorkInProgressHook;
    }
  } else {
    if (workInProgressHook.next === null) {
      isReRender = false;
      workInProgressHook = workInProgressHook.next = createHook();
    } else {
      isReRender = true;
      workInProgressHook = workInProgressHook.next;
    }
  }
  return workInProgressHook;
}

function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action
}

export function useState(initialState) {
  if (__DEV__) {
    currentHookNameInDev = 'useState'
  }
  return useReducer(basicStateReducer, initialState)
}

export function useReducer(reducer, initialArg, init) {
  if (__DEV__) {
    if (reducer !== basicStateReducer) {
      currentHookNameInDev = 'useReducer';
    }
  }
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  if (isReRender) {
    const queue = workInProgressHook.queue;
    const dispatch = queue.dispatch;
    if (renderPhaseUpdates !== null) {
      const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
      if (firstRenderPhaseUpdate !== undefined) {
        renderPhaseUpdates.delete(queue);
        let newState = workInProgressHook.memoizedState;
        let update = firstRenderPhaseUpdate;
        do {
          const action = update.action;
          if (__DEV__) {
            isInHookUserCodeInDev = true;
          }
          newState = reducer(newState, action);
          if (__DEV__) {
            isInHookUserCodeInDev = false;
          }
          update = update.next;
        } while (update !== null);

        workInProgressHook.memoizedState = newState;
        return [newState, dispatch];
      }
    }
  } else {
    if (__DEV__) {
      isInHookUserCodeInDev = true;
    }
    let initialState;
    if (reducer === basicStateReducer) {
      initialState = typeof initialArg === 'function' ? initialArg() : initialArg;
    } else {
      initialState = init !== undefined ? init(initialArg) : initialArg
    }
    if (__DEV__) {
      isInHookUserCodeInDev = false;
    }
    workInProgressHook.memoizedState = initialState;
    const queue = workInProgressHook.queue = {
      last: null,
      dispatch: null
    };
    const dispatch = queue.dispatch = dispatchAction.bind(null, currentlyRenderingComponent, queue);
    return [workInProgressHook.memoizedState, dispatch]
  }
}


/**
 * If the component is currently rendering, then add the action to the queue of actions to be executed
 * after the current render is complete
 * @param componentIdentity - The identity of the component that is currently being rendered.
 * @param queue - The queue that the action is being dispatched to.
 * @param action - The action to dispatch.
 */
function dispatchAction(componentIdentity, queue, action) {
  invariant(numberOfReRenders < RE_RENDER_LIMIT, 'Too many re-renders. React limits the number of renders to prevent an infinite loop');
  if (componentIdentity === currentlyRenderingComponent) {
    didScheduleRenderPhaseUpdate = true;
    const update = {
      action,
      next: null
    };
    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }
    const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);
    if (firstRenderPhaseUpdate === undefined) {
      renderPhaseUpdates.set(queue, update);
    } else {
      let lastRenderPhaseUpdate = firstRenderPhaseUpdate;
      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }
      lastRenderPhaseUpdate.next = update;
    }
  } else {

  }
}