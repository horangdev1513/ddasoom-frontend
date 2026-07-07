import { Outlet } from 'react-router-dom';

// 관리자 레이아웃 — 아직 빈 껍데기.
// 사이드바/관리자 헤더 등은 admin 담당(프론트 총괄)이 구현. 지금은 Outlet 자리만.
export function AdminLayout() {
  return (
    <div className="min-h-full">
      {/* 관리자 전용 셸 자리 (담당자 구현 예정) */}
      <Outlet />
    </div>
  );
}
