/** 백석대학교 통학버스 · 캠퍼스 셔틀버스 운행 정보 */

export const CAMPUS_SHUTTLE_SCHEDULE = [
  {
    direction: '등교',
    location:
      '두정역 하차 후 왼쪽 방면 승강기 및 계단 앞 승차장 (두정역 푸르지오 아파트 쪽)',
    days: '매일',
    time: '07:50 ~ 11:30 (상시운행)',
    note: null,
  },
  {
    direction: '하교',
    location: '셔틀버스 승차장 (백석대학교 운동장 옆)',
    days: '월~목',
    time: '13:30 ~ 18:00 (상시운행)',
    note: '백석대학교 → 천안터미널 → 천안역 → 기차 및 전철',
  },
  {
    direction: '하교',
    location: '셔틀버스 승차장 (백석대학교 운동장 옆)',
    days: '금',
    time: '13:30 ~ 17:30 (30분 간격 운행)',
    note: '백석대학교 → 천안터미널 → 천안역 → 기차 및 전철',
  },
];

export const COMMUTER_ROUTES = [
  {
    id: 'yeongdeungpo',
    name: '영등포',
    fare: '승차권 5,700원 (카드·현금 7,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~금',
        time: '06:50',
        stops: ['영등포 로터리 지하쇼핑센터 5번 출구 신한은행 앞'],
        note: null,
      },
      {
        direction: '하교',
        days: '월~금',
        time: '교대 노선 이용',
        stops: [],
        note: '교대역 정차 안함',
      },
    ],
  },
  {
    id: 'gyodae',
    name: '교대',
    fare: '승차권 5,700원 (카드·현금 7,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~목',
        time: '1회차 07:30 / 2회차 08:30',
        stops: ['교대역 8번 출구', '교대역 14번 출구(세연타워) 커피숍 앞'],
        note: null,
      },
      {
        direction: '등교',
        days: '금',
        time: '07:30',
        stops: ['교대역 8번 출구', '교대역 14번 출구(세연타워) 커피숍 앞'],
        note: null,
      },
      {
        direction: '하교',
        days: '월~목',
        time: '13:30, 14:30, 15:30, 16:30, 17:30, 18:20',
        stops: ['학교승차장', '신갈정류장', '죽전정류장', '양재', '강남'],
        note: '교대역 정차 안함',
      },
      {
        direction: '하교',
        days: '금',
        time: '14:30, 16:30',
        stops: ['학교승차장', '신갈정류장', '죽전정류장', '양재', '강남'],
        note: '교대역 정차 안함',
      },
    ],
  },
  {
    id: 'jamsil',
    name: '잠실',
    fare: '승차권 5,700원 (카드·현금 7,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~금',
        time: '06:50',
        stops: ['잠실역 4번 출구 (롯데마트) 전방 150M 시계탑 소화전 앞'],
        note: null,
      },
      {
        direction: '하교',
        days: '월~금',
        time: '교대 노선 이용',
        stops: [],
        note: '교대역 정차 안함',
      },
    ],
  },
  {
    id: 'bundang',
    name: '분당',
    fare: '승차권 5,700원 (카드·현금 7,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~목',
        time: '1회차 07:30 / 2회차 08:30',
        stops: ['야탑역 4번 출구 택시승강장 (MG새마을금고)'],
        note: null,
      },
      {
        direction: '등교',
        days: '금',
        time: '07:30',
        stops: ['야탑역 4번 출구 택시승강장 (MG새마을금고)'],
        note: null,
      },
      {
        direction: '하교',
        days: '월~목',
        time: '15:30, 16:30, 18:20',
        stops: ['학교승차장', '죽전정류장', '서현역', '야탑역'],
        note: null,
      },
      {
        direction: '하교',
        days: '금',
        time: '16:30',
        stops: ['학교승차장', '죽전정류장', '서현역', '야탑역'],
        note: null,
      },
    ],
  },
  {
    id: 'incheon-songnae',
    name: '인천 · 송내',
    fare: '승차권 6,500원 (카드·현금 7,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~금',
        time: '06:20 (인천 문학경기장) / 06:40 (송내)',
        stops: ['문학경기장역 1번 출구', '송내(남부역) 1번 출구 바닥 14번 표시자리'],
        note: null,
      },
      {
        direction: '하교',
        days: '월~목',
        time: '16:30, 18:20',
        stops: ['학교승차장', '송내 남부역'],
        note: null,
      },
      {
        direction: '하교',
        days: '금',
        time: '운행 없음',
        stops: [],
        note: '금요일 운행 없음',
      },
    ],
  },
  {
    id: 'ansan',
    name: '안산',
    fare: '승차권 6,000원 (카드·현금 7,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~금',
        time: '07:00 (중앙역) / 07:10 (상록수역)',
        stops: ['중앙역 1번 출구 택시승차장', '상록수역 3번 출구 롯데리아 앞'],
        note: null,
      },
      {
        direction: '하교',
        days: '월~목',
        time: '16:30, 18:20',
        stops: ['학교승차장', '상록수역', '중앙역'],
        note: null,
      },
      {
        direction: '하교',
        days: '금',
        time: '운행 없음',
        stops: [],
        note: '금요일 운행 없음',
      },
    ],
  },
  {
    id: 'anyang',
    name: '안양',
    fare: '승차권 5,400원 (카드·현금 6,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~목',
        time: '06:50 (안양역) / 07:00 (범계역)',
        stops: ['안양역 앞 1번가 공영주차장 앞', '범계역 4번 출구 택시승강장'],
        note: null,
      },
      {
        direction: '하교',
        days: '월~목',
        time: '16:30',
        stops: [
          '학교승차장',
          '신갈TG',
          '영통입구',
          '법원사거리',
          '범계역',
          '안양역',
        ],
        note: null,
      },
    ],
  },
  {
    id: 'suwon',
    name: '수원',
    fare: '승차권 5,400원 (카드·현금 6,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~목',
        time: '1회차 07:30~08:00 / 2회차 08:30~09:00',
        stops: [
          '법원사거리 쉐보레매장 (이브자리)',
          '영통 고가 밑 버스정류장 (영통입구 수원, 신갈IC 방면)',
          '수원 T/G 입구 버스정류장 (BMW 매장 앞)',
          '동탄 이마트 버스정류장 (동탄IC 방면)',
        ],
        note: '1회차: 07:30 법원사거리, 07:40 영통입구, 07:45 수원 T/G, 08:00 동탄이마트 / 2회차: 08:30, 08:40, 08:45, 09:00',
      },
      {
        direction: '등교',
        days: '금',
        time: '운행 없음',
        stops: [],
        note: '금요일 운행 없음',
      },
      {
        direction: '하교',
        days: '월~목',
        time: '안양 노선 이용',
        stops: [],
        note: null,
      },
    ],
  },
  {
    id: 'yongin',
    name: '용인',
    fare: '승차권 5,400원 (카드·현금 6,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~금',
        time: '07:10 / 07:15 / 07:30 / 07:35',
        stops: [
          '용인 시외버스터미널 공영주차장 앞',
          '명지대 사거리 근처 삼성디지털 앞',
          '강남대 삼거리 굿모닝외과 건물 앞',
          '신갈 고속시외버스 정류소',
        ],
        note: '07:10 용인시외버스터미널, 07:15 삼성디지털프라자, 07:30 강남대 삼거리, 07:35 신갈시외버스정류소',
      },
      {
        direction: '하교',
        days: '월~금',
        time: '교대 · 안양 · 수원 노선 이용',
        stops: ['신갈정류장 (고속도로)'],
        note: '노선 이용 후 신갈정류장 하차',
      },
    ],
  },
  {
    id: 'suwon-byeongjeong',
    name: '수원 · 병점 · 오산 · 평택',
    fare: '승차권 5,400원 (카드·현금 6,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~목',
        time: '07:00 / 07:15 / 07:30 / 08:10',
        stops: [
          '수원역 파출소 우측 50m 앞',
          '병점 홈플러스 버스정류장',
          '오산역 환승센터 파출소 20M 앞 (온누리약국)',
          '평택대 입구 GS25 편의점 버스승강장 앞',
          '평택 안성스타필드(마트킹) 버스승강장',
        ],
        note: '07:00 수원역, 07:15 병점, 07:30 오산, 08:10 평택',
      },
      {
        direction: '하교',
        days: '월~목',
        time: '하교차량 없음',
        stops: [],
        note: null,
      },
    ],
  },
  {
    id: 'jukjeon',
    name: '죽전',
    fare: '승차권 5,700원 (카드·현금 7,000원)',
    trips: [
      {
        direction: '등교',
        days: '월~목',
        time: '1회차 07:30~07:50 / 2회차 08:50~09:00 (수시운행)',
        stops: ['죽전 간이정류장 (고속도로 하행 부산 방면)'],
        note: null,
      },
      {
        direction: '등교',
        days: '금',
        time: '운행 없음',
        stops: [],
        note: '금요일 운행 없음',
      },
      {
        direction: '하교',
        days: '월~금',
        time: '서울 방면 노선 이용',
        stops: ['죽전 간이정류장 (고속도로 상행 서울 방면)'],
        note: '서울 방면 노선 이용 후 하차',
      },
    ],
  },
  {
    id: 'asan',
    name: '아산',
    fare: '승차권 2,000원',
    trips: [
      {
        direction: '등교',
        days: '월~금',
        time: '07:30 / 07:35 / 07:45',
        stops: [
          '아산시외버스터미널(모종환승장) 앞',
          '아산이마트 옆 LG전자 앞',
          '배방역 사거리 천안 13Km 표지판 앞',
        ],
        note: '07:30 터미널, 07:35 LG전자, 07:45 배방역 / 승차권 구입: 진리관 CU편의점 앞 발권기',
      },
      {
        direction: '하교',
        days: '월~금',
        time: '하교차량 없음',
        stops: [],
        note: null,
      },
    ],
  },
];

export const SHUTTLE_NOTICES = [
  {
    date: '안내',
    body: '자세한 통학버스 승차 위치는 백석대학교 홈페이지 공지사항을 참고 바랍니다.',
  },
  {
    date: '아산 노선',
    body: '아산 노선 승차권은 진리관 CU편의점 앞 발권기를 이용해 주세요.',
  },
];
