import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';

// 전역 푸터 — 피그마 메인 디자인 이식.
// 다크 브라운 계열은 테마 토큰에 없는 푸터 전용 색이라 arbitrary value로 이 파일 안에서만 사용한다.
// 링크 구성은 헤더 NAV_MENUS와 1:1 정합 — 두 곳이 다른 경로를 가리키지 않도록 경로 변경 시 항상 함께 수정.
const FOOTER_COLUMNS = [
  {
    title: '서비스',
    links: [
      { label: '유기동물 찾기', to: '/animals' },
      { label: '임시보호 신청', to: '/foster/apply' },
      { label: '커뮤니티', to: '/board' },
    ],
  },
  {
    title: '고객센터',
    links: [
      { label: '공지사항', to: '/support/notices' },
      { label: 'FAQ', to: '/support/faqs' },
      { label: '1:1 문의', to: '/support/qnas' },
    ],
  },
  {
    title: '따숨 소개',
    links: [
      { label: '따숨 이야기', to: '/about' },
      { label: '이용 안내', to: '/guide' },
    ],
  },
];

// 연락처는 링크가 아닌 정적 텍스트라 위 컬럼과 별도로 관리
const CONTACT_INFO = ['02-1234-5678', 'adminlee@ddasoom.com', '서울 영등포구 문래동'];

export function Footer() {
  return (
    <footer className="bg-[#2F2618] py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* 브랜드 */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <PawPrint size={15} className="text-white" />
              </div>
              <span className="text-xl font-bold text-accent">따숨</span>
            </div>
            <p className="text-sm leading-relaxed text-[#7A6A58]">
              유기동물 입양 플랫폼 따숨은
              <br />새 가족을 기다리는 아이들과
              <br />좋은 가족을 연결합니다.
            </p>
          </div>

          {/* 링크 컬럼 3개 — NAV_MENUS와 정합된 실제 경로 */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-base font-semibold text-[#EED9B6]">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-[#7A6A58] transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* 연락처 — 링크가 아닌 정적 정보 */}
          <div>
            <h4 className="mb-3 text-base font-semibold text-[#EED9B6]">연락처</h4>
            <ul className="space-y-2">
              {CONTACT_INFO.map((info) => (
                <li key={info} className="text-sm text-[#7A6A58]">
                  {info}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 border-t border-[#3D3020] pt-6 text-center">
          {/* 포트폴리오 프로젝트 고지 — 실존 보호소 데이터를 다루므로 오인 방지 차원에서 명시 */}
          <p className="text-xs leading-relaxed text-[#5A4A38]">
            따숨은 SeSac 교육과정의 팀 프로젝트로 제작된 서비스입니다.
            <br />
            유기동물 정보는 공공데이터포털(동물보호관리시스템)을 기반으로 제공됩니다.
          </p>
          <p className="text-sm text-[#5A4A38]">© 2026 Ddasoom Team. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}