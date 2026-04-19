# express-app

Express.js MVC 보일러플레이트 — Router / Controller / Model 구조 예제

## 시작하기

```bash
npm install
cp .env.example .env
npm run dev     # nodemon (개발)
npm start       # node   (프로덕션)
```

서버가 뜨면:
- **홈**      → http://localhost:3000/front/pages/home.html
- **유저**    → http://localhost:3000/front/pages/users.html
- **게시글**  → http://localhost:3000/front/pages/posts.html
- **카운터**  → http://localhost:3000/front/pages/counter.html

---

## 프로젝트 구조

```
express-app/
├── .env                        # 환경변수 (git 제외)
├── .env.example                # 환경변수 템플릿
├── package.json
│
├── public/
│   └── index.html              # GET / 응답 (Hello World)
│
├── front/                      # 정적 프론트엔드 (/front/* 로 서빙)
│   ├── pages/
│   │   ├── home.html
│   │   ├── users.html
│   │   ├── posts.html
│   │   └── counter.html
│   ├── components/
│   │   └── nav.js              # 공통 nav + api() 헬퍼 + showToast()
│   ├── styles/
│   │   └── global.css
│   └── js/
│       ├── home.js
│       ├── users.js
│       ├── posts.js
│       └── counter.js
│
└── src/
    ├── app.js                  # 진입점
    ├── middlewares/
    │   ├── logger.js           # 요청 로거 (색상 출력)
    │   ├── validate.js         # 유효성 검사 미들웨어 팩토리
    │   └── errorHandler.js     # 404 / 전역 에러 처리
    ├── routes/
    │   ├── homeRouter.js
    │   ├── userRouter.js
    │   ├── postRouter.js
    │   └── counterRouter.js
    ├── controllers/
    │   ├── homeController.js
    │   ├── userController.js
    │   ├── postController.js
    │   └── counterController.js
    └── models/
        ├── homeModel.js
        ├── userModel.js        # In-memory CRUD
        ├── postModel.js
        └── counterModel.js
```

---

## API 엔드포인트

### Users
| Method | Path | Body | 설명 |
|--------|------|------|------|
| GET | `/api/users` | — | 전체 목록 |
| GET | `/api/users/:id` | — | 단건 조회 |
| POST | `/api/users` | `{ name, email }` | 생성 |
| DELETE | `/api/users/:id` | — | 삭제 |

### Posts
| Method | Path | Body | 설명 |
|--------|------|------|------|
| GET | `/api/posts` | — | 전체 목록 |
| GET | `/api/posts/:id` | — | 단건 조회 |
| POST | `/api/posts` | `{ title, body }` | 생성 |
| DELETE | `/api/posts/:id` | — | 삭제 |

### Counter
| Method | Path | Body | 설명 |
|--------|------|------|------|
| GET | `/api/counter` | — | 현재 값 |
| POST | `/api/counter/adjust` | `{ delta }` | 증감 |
| POST | `/api/counter/reset` | — | 초기화 |

---

## Middleware

### `logger.js`
모든 요청의 메서드 / 경로 / 상태코드 / 응답시간을 색상으로 출력합니다.

```
[오후 3:42:01] GET     /api/users                     200 2ms
[오후 3:42:03] POST    /api/users                     201 1ms
[오후 3:42:05] DELETE  /api/users/1                   200 0ms
[오후 3:42:07] GET     /api/nothing                   404 1ms
```

### `validate.js`
라우터에서 필드 유효성 검사를 선언적으로 적용할 수 있습니다.

```js
const { validate, validateEmail, validateNumbers } = require('../middlewares/validate');

// 필수 필드 + 이메일 형식 검사
router.post('/', validate('name', 'email'), validateEmail(), controller.create);

// 숫자 타입 검사
router.post('/adjust', validate('delta'), validateNumbers('delta'), controller.adjust);
```

### `errorHandler.js`
`next(err)` 로 넘긴 에러를 일괄 처리합니다.  
`NODE_ENV=development` 일 때만 스택 트레이스를 응답에 포함합니다.

---

## DB 연결로 전환하기

현재는 In-memory 배열을 사용합니다.  
실제 DB로 전환하려면 `src/models/*.js` 만 수정하면 됩니다.

```js
// userModel.js — mongoose 예시
const User = require('./schemas/User');

const UserModel = {
  findAll:  ()           => User.find(),
  findById: (id)         => User.findById(id),
  create:   (data)       => User.create(data),
  delete:   (id)         => User.findByIdAndDelete(id),
};
```

Controller / Router 는 건드릴 필요가 없습니다.
