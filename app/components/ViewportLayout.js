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

export function BentixPage({
  as: Component = 'main',
  children,
  className = '',
  padding = 'default',
  style,
}) {
  return (
    <ViewportPage
      as={Component}
      className={joinClassNames('btx-page', padding ? `btx-page--${padding}` : '', className)}
      style={style}
    >
      {children}
    </ViewportPage>
  )
}

export function BentixContent({
  as: Component = 'div',
  width = 'default',
  gap = 'lg',
  children,
  className = '',
  style,
}) {
  return (
    <ContentFrame
      as={Component}
      width={width}
      className={joinClassNames('btx-content', gap ? `btx-content--${gap}` : '', className)}
      style={style}
    >
      {children}
    </ContentFrame>
  )
}

export function BentixSection({
  as: Component = 'section',
  variant = 'panel',
  children,
  className = '',
  style,
  ...props
}) {
  return (
    <SurfaceCard
      as={Component}
      variant={variant}
      className={joinClassNames('btx-section', className)}
      style={style}
      {...props}
    >
      {children}
    </SurfaceCard>
  )
}

export function BentixResponsiveGrid({
  as: Component = 'div',
  preset = 'cards',
  children,
  className = '',
  style,
}) {
  return (
    <Component
      className={joinClassNames(
        'vp-grid',
        'btx-responsive-grid',
        preset ? `btx-responsive-grid--${preset}` : '',
        className,
      )}
      style={style}
    >
      {children}
    </Component>
  )
}

export function BentixOverflowX({
  as: Component = 'div',
  children,
  className = '',
  style,
}) {
  return (
    <Component
      className={joinClassNames('vp-overflow-x-auto', 'btx-overflow-x', className)}
      style={style}
    >
      {children}
    </Component>
  )
}
