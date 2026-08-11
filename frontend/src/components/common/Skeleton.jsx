export default function Skeleton({ variant = 'text', width, height, count = 1, className = '' }) {
  const elements = Array.from({ length: count })

  return (
    <>
      {elements.map((_, i) => (
        <div
          key={i}
          className={`skeleton skeleton--${variant} ${className}`}
          style={{
            width: width || undefined,
            height: height || undefined,
          }}
        />
      ))}
    </>
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height="14px"
        />
      ))}
    </div>
  )
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return <Skeleton variant="circle" width={`${size}px`} height={`${size}px`} className={className} />
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton-card ${className}`}>
      <div className="skeleton-card-header">
        <SkeletonCircle size={48} />
        <div className="skeleton-card-info">
          <Skeleton variant="text" width="120px" height="16px" />
          <Skeleton variant="text" width="80px" height="12px" />
        </div>
      </div>
      <div className="skeleton-card-body">
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

export function SkeletonProfile({ className = '' }) {
  return (
    <div className={`skeleton-profile ${className}`}>
      <SkeletonCircle size={80} />
      <Skeleton variant="text" width="150px" height="20px" />
      <Skeleton variant="text" width="100px" height="14px" />
      <div className="skeleton-profile-details">
        <SkeletonText lines={4} />
      </div>
    </div>
  )
}
