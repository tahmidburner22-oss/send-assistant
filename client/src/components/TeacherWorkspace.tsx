import React, { type ElementType, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function TeacherWorkspace({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={joinClasses("teacher-workspace", className)}>{children}</div>;
}

export function TeacherPageHeader({
  eyebrow = "Teacher workspace",
  title,
  description,
  icon,
  actions,
  meta,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  icon?: LucideIcon | ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <header className={joinClasses("teacher-page-header", className)}>
      <div aria-hidden className="teacher-page-header-orbit teacher-page-header-orbit-one" />
      <div aria-hidden className="teacher-page-header-orbit teacher-page-header-orbit-two" />
      <div className="relative flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
        {icon && (
          <div className="teacher-page-header-icon" aria-hidden="true">
            {React.isValidElement(icon)
              ? icon
              : React.createElement(icon as ElementType, { className: "h-5 w-5" })}
          </div>
        )}
        <div className="min-w-0">
          <p className="teacher-studio-eyebrow text-brand">{eyebrow}</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description && <div className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</div>}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
      </div>
      {actions && <div className="relative flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>}
    </header>
  );
}

export function TeacherWorkspacePanel({
  children,
  className,
  as: Component = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "section" | "div" | "aside";
}) {
  return (
    <Component className={joinClasses("teacher-workspace-panel", className)}>
      {children}
    </Component>
  );
}

export function TeacherSectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={joinClasses("teacher-section-heading", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="teacher-studio-eyebrow text-brand">{eyebrow}</p>}
        <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">{title}</h2>
        {description && <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
