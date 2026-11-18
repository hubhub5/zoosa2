// 판매 설정. 여기만 바꾸면 된다.
export const CONFIG = {
  /** 그로블 상품 페이지 주소  */
  grobleUrl: '', // TODO: 새 그로블 상품(결제창) 주소
  price: 9900,
  priceLabel: '9,900원',
  /**
   * 해제코드의 SHA-256 해시 목록. 코드 원문은 여기에 두지 않는다.
   * 새 코드 만들기: node scripts/hash-code.mjs 새코드
   * 코드를 바꿀 때는 기존 해시를 바로 지우지 말고 2~4주 함께 둔다.
   */
  unlockHashes: [
    // TODO: 이 사이트 전용 코드 해시 (node scripts/hash-code.mjs 새코드). 보호자사주(zoosa) 코드는 여기서 안 열린다
  ],
  contact: 'study_4ever@naver.com',
  seller: '놀이댕산',
  brand: '보호자사주',
  /** 관리자 편집 페이지가 문구를 저장할 GitHub 저장소 */
  repo: 'hubhub5/zoosa2',
  /**
   * 자동 결제 확인. 둘 다 채워야 켜진다 (비어 있으면 코드 방식만)
   * groblePayUrl: 그로블 결제창 링크 (상품 관리 → 링크 복사, groble.im/payment/...). 뒤에 ?ref= 를 붙여 보낸다
   * paidApi: 결제 확인 서버 주소 (worker/ 배포 후 나온 workers.dev 주소)
   * 그로블 '결제 후 이동 페이지'에는 https://hubhub5.github.io/zoosa2/unlock.html?paid=1 을 넣는다
   */
  groblePayUrl: '', // TODO: 새 그로블 결제창 주소
  paidApi: '', // TODO: worker/setup.sh 로 새 서버(zoosa2-paid) 올린 뒤 주소
};
