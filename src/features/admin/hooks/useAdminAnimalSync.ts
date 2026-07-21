import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { syncAnimals } from "@/features/admin/api/adminAnimalApi";

// 관리자 유기동물 수동 동기화 뮤테이션.
// 조회 캐시가 아니라 서버 DB를 갱신하는 작업이라 invalidate 대상이 없다(유저 목록은 자연 refetch로 반영).
export function useAdminAnimalSync() {
  return useMutation({
    mutationFn: syncAnimals,
    onSuccess: (message) =>
      toast.success(message || "동기화가 완료되었습니다."),
    onError: () =>
      toast.error("동기화에 실패했습니다. 잠시 후 다시 시도해 주세요."),
  });
}
