function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

export function ViewportPage({
  as: Component = 'main',
  children,
  className = '',
  lockViewport = false,
  style,
}) {
  return (
    <Component
      className={joinClassNames('vp-page-root', lockViewport ? 'vp-page-fixed' : '', className)}
      style={style}
    >
      {children}
    </Component>
  )
}

export function ViewportShell({
  as: Component = 'div',
  children,
  className = '',
  fillHeight = false,
  style,
}) {
  return (
    <Component
      className={joinClassNames('vp-page-shell', fillHeight ? 'vp-page-shell-fill' : '', className)}
      style={style}
    >
      {children}
    </Component>
  )
}

export function ViewportScrollArea({
  as: Component = 'div',
  allowHorizontal = false,
  children,
  className = '',
  style,
}) {
  return (
    <Component
      className={joinClassNames(
        'vp-page-scroll',
        allowHorizontal ? 'vp-page-scroll-x' : '',
        className,
      )}
      style={style}
    >
      {children}
    </Component>
  )
}

export function ContentFrame({
  as: Component = 'div',
  width = 'default',
  children,
  className = '',
  style,
}) {
  return (
    <Component
      className={joinClassNames(
        'vp-content-frame',
        width ? `vp-content-frame--${width}` : '',
        className,
      )}
      style={style}
    >
      {children}
    </Component>
  )
}

export function FlowStack({
  as: Component = 'div',
  gap = 'md',
  children,
  className = '',
  style,
}) {
  return (
    <Component
      className={joinClassNames('vp-flow-stack', gap ? `vp-flow-stack--${gap}` : '', className)}
      style={style}
    >
      {children}
    </Component>
  )
}

export function ResponsiveGrid({
  as: Component = 'div',
  preset = 'auto',
  children,
  className = '',
  style,
}) {
  return (
    <Component
      className={joinClassNames('vp-grid', preset ? `vp-grid--${preset}` : '', className)}
      style={style}
    >
      {children}
    </Component>
  )
}

export function SurfaceCard({
  as: Component = 'section',
  variant = 'panel',
  interactive = false,
  children,
  className = '',
  style,
  ...props
}) {
  return (
    <Component
      className={joinClassNames(
        'vp-surface-card',
        variant ? `vp-surface-card--${variant}` : '',
        interactive ? 'vp-surface-card--interactive' : '',
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </Component>
  )
}
