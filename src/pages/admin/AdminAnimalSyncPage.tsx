import { RefreshCw, Loader2, Database, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAdminAnimalSync } from "@/features/admin/hooks/useAdminAnimalSync";

// 관리자 — 유기동물 데이터 수동 미러링 동기화 페이지.
// 공공데이터포털 API를 DB에 반영하는 트리거. 동기 처리라 완료까지 버튼을 로딩 상태로 유지한다.
export function AdminAnimalSyncPage() {
  const { mutate: sync, isPending, isSuccess } = useAdminAnimalSync();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          유기동물 데이터 동기화
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          공공데이터포털의 유기동물 정보를 가져와 서비스 DB에 반영합니다.
        </p>
      </div>

      <div className="max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15">
            <Database size={20} className="text-ring" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">수동 미러링 실행</p>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
              전체 페이지를 순회하며 유기번호 기준으로 신규 등록·갱신합니다.
              데이터 양에 따라{" "}
              <span className="font-medium text-slate-700">수 분</span>이 걸릴
              수 있으며, 완료될 때까지 이 페이지를 벗어나지 마세요.
            </p>
          </div>
        </div>

        {/* 안내 리스트 */}
        <ul className="mb-6 space-y-1.5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <li>• 기존 동물의 좋아요 수·임시보호 상태는 덮어쓰지 않습니다.</li>
          <li>• 일부 항목에 이상이 있어도 나머지는 정상 반영됩니다.</li>
          <li>• 중복 유기번호는 자동으로 갱신 처리됩니다.</li>
        </ul>

        <Button
          onClick={() => sync()}
          disabled={isPending}
          className="w-full bg-ring text-white hover:brightness-105"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              동기화 진행 중…
            </>
          ) : (
            <>
              <RefreshCw />
              지금 동기화
            </>
          )}
        </Button>

        {/* 마지막 실행 결과 (토스트와 별개로 화면에도 표시) */}
        {isSuccess && !isPending && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-600">
            <CheckCircle2 size={15} />
            최근 동기화가 완료되었습니다.
          </p>
        )}
      </div>
    </div>
  );
}
