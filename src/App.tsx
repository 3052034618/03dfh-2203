import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/dashboard/Dashboard";
import TemplateList from "@/pages/templates/TemplateList";
import TemplateDetail from "@/pages/templates/TemplateDetail";
import AuditList from "@/pages/audits/AuditList";
import AuditDetail from "@/pages/audits/AuditDetail";
import ReviewList from "@/pages/reviews/ReviewList";
import ReviewDetail from "@/pages/reviews/ReviewDetail";

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/templates" element={<TemplateList />} />
          <Route path="/templates/new" element={<TemplateDetail />} />
          <Route path="/templates/:id" element={<TemplateDetail />} />
          <Route path="/audits" element={<AuditList />} />
          <Route path="/audits/:id" element={<AuditDetail />} />
          <Route path="/reviews" element={<ReviewList />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
