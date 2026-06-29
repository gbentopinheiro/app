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
