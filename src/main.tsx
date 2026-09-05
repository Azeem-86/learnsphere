import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { AppProvider } from "@/lib/app-context";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Organizations = lazy(() => import("./pages/Organizations.tsx"));
const Members = lazy(() => import("./pages/Members.tsx"));
const Courses = lazy(() => import("./pages/Courses.tsx"));
const MyCourses = lazy(() => import("./pages/MyCourses.tsx"));
const CourseDetail = lazy(() => import("./pages/CourseDetail.tsx"));
const CourseBuilder = lazy(() => import("./pages/CourseBuilder.tsx"));
const LessonPlayer = lazy(() => import("./pages/LessonPlayer.tsx"));
const Assignments = lazy(() => import("./pages/Assignments.tsx"));
const Grades = lazy(() => import("./pages/Grades.tsx"));
const Certificates = lazy(() => import("./pages/Certificates.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

function DashboardRoute({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppProvider>
        {children}
      </AppProvider>
    </RequireAuth>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/auth"
                element={<AuthPage redirectAfterAuth="/dashboard" />}
              />
              <Route
                path="/verify"
                element={<VerifyCertificate />}
              />

              {/* Dashboard routes - wrapped in RequireAuth + AppProvider */}
              <Route
                path="/dashboard"
                element={
                  <DashboardRoute>
                    <Dashboard />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/organizations"
                element={
                  <DashboardRoute>
                    <Organizations />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/members"
                element={
                  <DashboardRoute>
                    <Members />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/courses"
                element={
                  <DashboardRoute>
                    <Courses />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/my-courses"
                element={
                  <DashboardRoute>
                    <MyCourses />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/course/:courseId"
                element={
                  <DashboardRoute>
                    <CourseDetail />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/course-builder"
                element={
                  <DashboardRoute>
                    <CourseBuilder />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/lesson/:lessonId"
                element={
                  <DashboardRoute>
                    <LessonPlayer />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/assignments"
                element={
                  <DashboardRoute>
                    <Assignments />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/grades"
                element={
                  <DashboardRoute>
                    <Grades />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/certificates"
                element={
                  <DashboardRoute>
                    <Certificates />
                  </DashboardRoute>
                }
              />
              <Route
                path="/dashboard/settings"
                element={
                  <DashboardRoute>
                    <Settings />
                  </DashboardRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
