// 판매 설정. 여기만 바꾸면 된다.
export const CONFIG = {
  /** 그로블 상품 페이지 주소  */
  grobleUrl: '', // TODO: 새 그로블 상품(결제창) 주소
  price: 13900,
  priceLabel: '13,900원',
  /**
   * 해제코드의 SHA-256 해시 목록. 코드 원문은 여기에 두지 않는다.
   * 새 코드 만들기: node scripts/hash-code.mjs 새코드
   * 코드를 바꿀 때는 기존 해시를 바로 지우지 말고 2~4주 함께 둔다.
   */
  unlockHashes: <string[]>[
    // 테스터용 무료 코드 10개 (2026-11-18). 원문은 저장소 밖 tester-codes.txt. 한 줄 지우면 그 코드만 막힌다
    'add27122e2f4f406944026700887a3a3cac52145168c61afb4ddcb9f9824ea8c', // 테스터 01
    'df9ef8b40d6ccb6355a435185da8ae2a285e76d7d2ef7f4d012b2871b2ee8cba', // 테스터 02
    '6b2255bd259f91925b7d986157d11c2ed79a4dd9af45c5e50f8ea9f1304c49a3', // 테스터 03
    'c9704e032753c72ca290d319ee8e142ffe6ca7b486f95cb6e2fd7e4ab09f3ffb', // 테스터 04
    'cecafd2b6d9d911057b861eb2473cb9e7ebe8668030ae81808fa93e6018e8e1e', // 테스터 05
    'fd36eee758ba592792a3f612445ea2ca29503c241892f9748bb1cbf598f15c47', // 테스터 06
    'aef1407b4abb20f575cbf60e94cf216e70f5bf5794ac3884a54d95a2c2f57f9f', // 테스터 07
    '26551dce00ef5fd9671f1298ee319a874263c5fb0239c24a8b354a1acd0c3cd0', // 테스터 08
    '7a075cae8463cf2dd3a62fec491972e66f2e973f465de5b80f9f6cb024173b67', // 테스터 09
    '51d22119b2110ecb7bb71f38443e5a6e5127f1fe173fc3bd8f9125f74334a18b', // 테스터 10
  ],
  contact: 'study_4ever@naver.com',
  seller: '놀이댕산',
  brand: '되풀이사주',
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
