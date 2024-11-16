import React from "react";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div>ref) = { ref },
  className = {
    cn(
        ,

    className
        ); },
{ ...props }
        /  >
), Card, displayName = "Card";
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div>ref) = { ref },
  className = { cn(, className); },
  { ...props }
  /  >
), CardHeader, displayName = "CardHeader";
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3>ref) = { ref },
  className = {
    cn(
        ,

    className
        ); },
{ ...props }
        /  >
), CardTitle, displayName = "CardTitle";
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div>ref) = { ref }, className = { cn(, className); }, { ...props } /  >
), CardContent, displayName = "CardContent";
export { Card, CardHeader, CardTitle, CardContent };
