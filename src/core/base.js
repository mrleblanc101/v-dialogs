import {
  h,
  ref,
  inject,
  computed,
  onBeforeMount,
  onMounted,
  onUnmounted,
  mergeProps
} from 'vue'

import {
  cssValue,
  calculateDialogTop,
  calculateDialogZIndex,
  hideDocumentBodyOverflow,
  restoreDocumentBodyOverflow
} from './helper'
import { messageAdjustPositionEvent, addDialog } from './manage'
import {
  EMIT_CLOSE,
  EMIT_RENDER_DIALOG,
  EVENT_MESSAGE_ADJUST_POSITION,
  propsInjectionKey
} from '../constants'
import { EN } from '../language'

export const baseProps = {
  /** Dialog key */
  dialogKey: { type: String, default: '' },
  dialogIndex: { type: Number, required: true },
  singletonKey: { type: String, default: '' },
  customClass: { type: String, default: '' },
  /** Display dialog backdrop */
  backdrop: { type: Boolean, default: true },
  /** Click backdrop to close dialog */
  backdropClose: { type: Boolean, default: false },
  /** whether to display header */
  header: { type: Boolean, default: true },
  title: { type: String, default: '' },
  message: { type: [String, Object], default: '' },
  /** Dialog width */
  width: { type: Number, default: 0 },
  /** Dialog height */
  height: { type: Number, default: 0 },
  shake: { type: Boolean, default: false },
  /**
   * Auto close dialog milliseconds
   * - 0: disabled automatic close
   * - number of milliseconds: specify times to automatic close dialog
   */
  duration: { type: Number, default: 0 },
  language: { type: String, default: EN },
  callback: { type: Function, default: undefined }
}

export const baseEmits = [EMIT_CLOSE, EMIT_RENDER_DIALOG]

export function useDialog (props, emit) {
  const show = ref(false)
  const shaking = ref(false)
  const width = ref(0)
  const height = ref(0)
  const top = ref()
  const bottom = ref()
  const transitionEnterComplete = ref(false)
  const shouldControlOverflow = ref(true)
  const shouldHandleResize = ref(true)
  const destroy = ref()

  const { dialogZIndex, backdropZIndex } = calculateDialogZIndex(props.dialogIndex)

  // the style v-dialog-dialog used
  const dialogStyles = computed(() => {
    const styles = {}
    if (typeof width.value !== 'undefined') {
      styles.width = cssValue(width.value)
    }
    if (typeof height.value !== 'undefined') {
      styles.height = cssValue(height.value)
    }
    if (typeof top.value !== 'undefined') {
      styles.top = cssValue(top.value)
    }
    if (typeof bottom.value !== 'undefined') {
      styles.bottom = cssValue(bottom.value)
    }
    return styles
  })
  // the style v-dialog-content used
  // TODO: to remove
  const contentStyles = computed(() => ({
    height: cssValue(height.value)
  }))

  function getTopValue (topValue) {
    if (typeof topValue !== 'undefined') return topValue

    // center of screen
    return calculateDialogTop(height.value)
  }
  function setDialogSize (dialogWidth, dialogHeight) {
    width.value = dialogWidth
    height.value = dialogHeight
  }
  function setPosition (topValue, bottomValue) {
    top.value = getTopValue(topValue)
    if (typeof bottomValue !== 'undefined') {
      bottom.value = bottomValue
    }
  }
  function openDialog () {
    show.value = true
    emit(EMIT_RENDER_DIALOG, true)

    if (shouldControlOverflow.value) hideDocumentBodyOverflow()
  }
  /**
   * Close dialog
   * @param {function} callback callback function after dialog closed
   * @param {unknown} data the data that will be returned to the caller
   * @param {object} options custom options and life cycle
   *
   * Life cycle
   * - closing
   * - afterClose
   */
  function closeDialog (callback, data, options) {
    if (!transitionEnterComplete.value) return

    show.value = false
    options?.closing?.()

    // destroy dialog when transition leave complete
    destroy.value = () => {
      // close and destroy dialog
      emit(EMIT_CLOSE, callback, data)
      options?.afterClose?.()
      // destroy DialogModalBox component
      emit(EMIT_RENDER_DIALOG, false)

      if (shouldControlOverflow.value) restoreDocumentBodyOverflow()
    }
  }
  function closeWithCallback (data, options) {
    closeDialog(props.callback, data, options)
  }
  function closeWithoutCallback (options) {
    closeDialog(undefined, undefined, options)
  }
  function setupPositionAdjustBehavior (setTop) {
    if (shouldHandleResize.value) useResizeAdjust(setTop)

    onBeforeMount(() => {
      setTop()
    })
  }
  function setupAutomaticClose (close) {
    onMounted(() => {
      useAutomaticClose(props, close)
    })
  }
  function onTransitionAfterEnter () {
    transitionEnterComplete.value = true
  }
  function onTransitionAfterLeave () {
    destroy.value && destroy.value()
  }

  return {
    show,
    shaking,
    transitionEnterComplete,
    shouldControlOverflow,
    shouldHandleResize,
    dialogStyles,
    contentStyles,
    dialogZIndex,
    backdropZIndex,
    openDialog,
    destroy,
    closeDialog,
    closeWithCallback,
    closeWithoutCallback,
    setPosition,
    setDialogSize,
    setupAutomaticClose,
    setupPositionAdjustBehavior,
    onTransitionAfterEnter,
    onTransitionAfterLeave
  }
}

export function useDialogComponent (slots) {
  const {
    component,
    params,
    closeDialogWithCallback
  } = inject(propsInjectionKey)

  function getComponentContent () {
    // use slot content first
    if (slots.default) return slots.default()
    // dynamic component
    if (!component) return

    const VNode = typeof component === 'function'
      ? component()
      : component

    const options = {
      onClose: data => closeDialogWithCallback(data)
    }
    return h(VNode, mergeProps(params, options))
  }

  return { getComponentContent }
}

/**
 * Automatically close dialog at a specified time
 * @param {object} props
 * @param {function} close
 */
export function useAutomaticClose (props, close) {
  if (!props.duration) return

  setTimeout(close, props.duration)
}

export function useResizeAdjust (callback, wait = 200) {
  let timer

  function resizeHandler () {
    clearTimeout(timer)
    timer = setTimeout(callback, wait)
  }

  onMounted(() => {
    addEventListener('resize', resizeHandler, false)
  })

  onUnmounted(() => {
    removeEventListener('resize', resizeHandler, false)
  })
}

export function useGroupItemPositionAdjust (handler) {
  return {
    bindPositionAdjust: () => addEventListener(EVENT_MESSAGE_ADJUST_POSITION, handler, false),
    unbindPositionAdjust: () => removeEventListener(EVENT_MESSAGE_ADJUST_POSITION, handler, false),
    triggerPositionAdjust: () => dispatchEvent(messageAdjustPositionEvent)
  }
}

export function useCloseDialog (emit, closeWithCallback, closeWithoutCallback) {
  const closeOptions = {
    closing: () => {
      emit('update:visible', false)
    }
  }
  function closeDialogWithCallback (data) {
    closeWithCallback(data, closeOptions)
  }
  function closeDialogWithoutCallback () {
    closeWithoutCallback(closeOptions)
  }

  return {
    closeDialogWithCallback,
    closeDialogWithoutCallback
  }
}

export function useComponent (component, { attrs, slots }) {
  const renderDialog = ref(false)

  const { index, key } = addDialog()
  const baseProps = {
    dialogKey: key,
    dialogIndex: index,
    onRenderDialog: val => {
      renderDialog.value = val
    }
  }

  return () => {
    if (!attrs.visible && !renderDialog.value) return

    return h(component, mergeProps(attrs, baseProps), () => slots.default())
  }
}
