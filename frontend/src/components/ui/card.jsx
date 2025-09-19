import React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const Card = React.forwardRef(({ className, variant = 'default', loading = false, error = false, ...props }, ref) => {
  const variants = {
    default: "rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-smooth",
    elevated: "rounded-xl border bg-card text-card-foreground shadow-lg hover:shadow-xl transition-smooth hover-lift",
    interactive: "rounded-lg border bg-card text-card-foreground shadow-sm hover-lift hover-glow transition-smooth cursor-pointer transform hover:scale-[1.02]",
    minimal: "rounded-lg bg-card text-card-foreground transition-smooth",
    glass: "rounded-xl glass backdrop-blur-md border border-white/20 shadow-elegant",
    gradient: "rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-colored",
    featured: "rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-colored hover-lift transition-smooth"
  }

  if (loading) {
    return (
      <div ref={ref} className={cn(variants[variant], "relative overflow-hidden", className)} {...props}>
        <div className="absolute inset-0 skeleton rounded-lg" />
        <div className="relative p-6 opacity-30">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div ref={ref} className={cn(variants[variant], "border-red-200 bg-red-50", className)} {...props}>
        <div className="p-6 text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-red-700 text-sm">Failed to load content</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})

const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  >
    {children}
  </div>
))

const CardTitle = React.forwardRef(({ className, children, gradient = false, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      gradient && "text-gradient",
      className
    )}
    {...props}
  >
    {children}
  </h3>
))

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
))

// Enhanced skeleton loader for cards
const CardSkeleton = ({ className, ...props }) => (
  <div className={cn("rounded-lg border bg-card shadow-sm", className)} {...props}>
    <div className="p-6">
      <div className="space-y-4">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
      </div>
    </div>
  </div>
)

// Card with image support
const ImageCard = React.forwardRef(({
  className,
  imageSrc,
  imageAlt,
  imageClassName,
  loading = false,
  error = false,
  ...props
}, ref) => {
  if (loading) return <CardSkeleton className={className} />

  return (
    <Card
      ref={ref}
      className={cn("overflow-hidden", className)}
      variant="elevated"
      error={error}
      {...props}
    >
      {imageSrc && (
        <div className="relative overflow-hidden">
          <img
            src={imageSrc}
            alt={imageAlt}
            className={cn(
              "w-full h-48 object-cover transition-transform duration-300 hover:scale-105",
              imageClassName
            )}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzlmYTJhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4='
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}
      <div className="p-6">
        {props.children}
      </div>
    </Card>
  )
})

Card.displayName = "Card"
CardHeader.displayName = "CardHeader"
CardTitle.displayName = "CardTitle"
CardDescription.displayName = "CardDescription"
CardContent.displayName = "CardContent"
CardFooter.displayName = "CardFooter"
CardSkeleton.displayName = "CardSkeleton"
ImageCard.displayName = "ImageCard"

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardSkeleton,
  ImageCard
}
