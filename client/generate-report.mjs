import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, VerticalAlign,
  PageNumber, Header, Footer, LevelFormat, BorderStyle,
  convertInchesToTwip,
} from 'docx';
import fs from 'fs';

/* ═══════════════════════════════════════════
   Exact formatting from template:
   - Page: 11940 x 16860 twips (A4)
   - Margins: top=1060, bottom=1040, left=1275, right=708
   - Body: Times New Roman 14pt (sz=28), left=427, firstLine=705, justified, line=360 auto
   - Heading1: TNR 14pt bold, centered, ind left=331
   - Heading2: TNR 14pt bold, justified, ind left=1546 hanging=414
   - Title: TNR 16pt bold, centered
   - Lists: ind left=1578, hanging=446, sz=28
   - Footer: PAGE field sz=24, centered
   ═══════════════════════════════════════════ */
const FONT = 'Times New Roman';
const SZ = 28; // 14pt
const LINE = 360; // 1.5 spacing

/* ── helpers ── */
function body(text, opts = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({ font: FONT, size: SZ, ...opts.runOpts, text }));
  } else if (Array.isArray(text)) {
    text.forEach(t => runs.push(new TextRun({ font: FONT, size: SZ, ...t })));
  }
  return new Paragraph({
    children: runs,
    spacing: { line: LINE, lineRule: 'auto', before: opts.before || 0 },
    alignment: AlignmentType.JUSTIFIED,
    indent: {
      left: opts.left ?? 427,
      firstLine: opts.noIndent ? 0 : (opts.firstLine ?? 705),
      right: opts.right ?? 150,
    },
  });
}

function heading1(text) {
  return new Paragraph({
    children: [new TextRun({ font: FONT, size: SZ, bold: true, text })],
    spacing: { before: 65, line: 240, lineRule: 'auto' },
    alignment: AlignmentType.CENTER,
    indent: { left: 331, right: 51, firstLine: 0 },
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ font: FONT, size: SZ, bold: true, text })],
    spacing: { before: 161, line: LINE, lineRule: 'auto' },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 427, firstLine: 705, right: 150 },
  });
}

function empty(before = 0) {
  return new Paragraph({
    children: [new TextRun({ font: FONT, size: SZ, text: '' })],
    spacing: { line: 240, lineRule: 'auto', before },
  });
}

function listItem(text, num) {
  return new Paragraph({
    children: [new TextRun({ font: FONT, size: SZ, text: `${num}. ${text}` })],
    spacing: { line: 240, lineRule: 'auto', before: 160 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 1578, hanging: 446, right: 150 },
  });
}

function dashItem(text, opts = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({ font: FONT, size: SZ, text: `\u2013 ${text}` }));
  } else {
    runs.push(new TextRun({ font: FONT, size: SZ, text: '\u2013 ' }));
    text.forEach(t => runs.push(new TextRun({ font: FONT, size: SZ, ...t })));
  }
  return new Paragraph({
    children: runs,
    spacing: { line: opts.lineSpacing ?? LINE, lineRule: 'auto', before: opts.before ?? 0 },
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: 1578, hanging: 446, right: 150 },
  });
}

function figCaption(num, text) {
  return new Paragraph({
    children: [new TextRun({ font: FONT, size: SZ, text: `Рисунок ${num} \u2013 ${text}` })],
    spacing: { line: LINE, lineRule: 'auto', before: 120 },
    alignment: AlignmentType.CENTER,
    indent: { firstLine: 0 },
  });
}

function imgPlaceholder(num, text) {
  return new Paragraph({
    children: [new TextRun({ font: FONT, size: SZ, italics: true, text: `[Вставить скриншот: ${text}]` })],
    spacing: { line: LINE, lineRule: 'auto', before: 160 },
    alignment: AlignmentType.CENTER,
    indent: { firstLine: 0 },
  });
}

function codeLines(lines) {
  return lines.map(line =>
    new Paragraph({
      children: [new TextRun({ font: 'Courier New', size: 22, text: line })],
      spacing: { line: 240, lineRule: 'auto' },
      indent: { left: 1132, firstLine: 0 },
    })
  );
}

function pageBreak() {
  return new Paragraph({ children: [new TextRun({ text: '' })], pageBreakBefore: true });
}

/* table helpers */
function tCell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ font: opts.font || FONT, size: opts.sz || SZ, bold: opts.bold, text })],
      alignment: opts.align ?? AlignmentType.CENTER,
      spacing: { line: 240, lineRule: 'auto' },
      indent: { firstLine: 0 },
    })],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    verticalAlign: VerticalAlign.CENTER,
  });
}

/* ═══════════════════════════════════════════
   TITLE PAGE — matches template exactly
   ═══════════════════════════════════════════ */
function titlePage() {
  const c = (text, sz, bold = true) => new Paragraph({
    children: [new TextRun({ font: FONT, size: sz, bold, text })],
    alignment: AlignmentType.CENTER,
    indent: { left: 331, right: 14, firstLine: 0 },
    spacing: { line: 240, lineRule: 'auto', before: 0 },
  });
  const left = (text, sz = SZ, bold = false, before = 0) => new Paragraph({
    children: [new TextRun({ font: FONT, size: sz, bold, text })],
    alignment: AlignmentType.LEFT,
    indent: { left: 141, firstLine: 0 },
    spacing: { line: 240, lineRule: 'auto', before },
  });
  const leftBoldNormal = (boldText, normalText) => new Paragraph({
    children: [
      new TextRun({ font: FONT, size: SZ, bold: true, text: boldText }),
      new TextRun({ font: FONT, size: SZ, text: normalText }),
    ],
    alignment: AlignmentType.LEFT,
    indent: { left: 141, firstLine: 0 },
    spacing: { line: 240, lineRule: 'auto' },
  });

  return [
    new Paragraph({
      children: [new TextRun({ font: FONT, size: 24, bold: true, text: 'Министерство науки высшего образования Российской Федерации' })],
      alignment: AlignmentType.CENTER,
      indent: { left: 331, right: 14, firstLine: 0 },
      spacing: { before: 67, line: 240, lineRule: 'auto' },
    }),
    new Paragraph({
      children: [new TextRun({ font: FONT, size: 16, bold: true, text: 'ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ АВТОНОМНОЕ ОБРАЗОВАТЕЛЬНОЕ УЧРЕЖДЕНИЕ ВЫСШЕГО ОБРАЗОВАНИЯ' })],
      alignment: AlignmentType.CENTER,
      indent: { left: 331, firstLine: 0 },
      spacing: { before: 87, line: 240, lineRule: 'auto' },
    }),
    new Paragraph({
      children: [new TextRun({ font: FONT, size: 26, bold: true, text: '«НАЦИОНАЛЬНЫЙ ИССЛЕДОВАТЕЛЬСКИЙ УНИВЕРСИТЕТ ИТМО»' })],
      alignment: AlignmentType.CENTER,
      indent: { left: 331, right: 20, firstLine: 0 },
      spacing: { before: 92, line: 240, lineRule: 'auto' },
    }),
    new Paragraph({
      children: [new TextRun({ font: FONT, size: 26, bold: true, text: '(Университет ИТМО)' })],
      alignment: AlignmentType.CENTER,
      indent: { left: 331, right: 11, firstLine: 0 },
      spacing: { before: 90, line: 240, lineRule: 'auto' },
    }),
    empty(65),
    left('Факультет ПИН', SZ, true),
    new Paragraph({
      children: [
        new TextRun({ font: FONT, size: SZ, bold: true, text: 'Образовательная программа Мобильные и облачные технологии' }),
      ],
      alignment: AlignmentType.LEFT,
      indent: { left: 141, firstLine: 0 },
      spacing: { before: 321, line: 482, lineRule: 'auto' },
    }),
    left('Направление подготовки (специальность) Прикладная информатика', SZ, true),
    empty(),
    empty(130),
    // О Т Ч Е Т
    new Paragraph({
      children: [new TextRun({ font: FONT, size: 32, bold: true, text: 'О Т Ч Е Т' })],
      alignment: AlignmentType.CENTER,
      indent: { left: 719, firstLine: 0 },
      spacing: { line: 240, lineRule: 'auto' },
    }),
    new Paragraph({
      children: [new TextRun({ font: FONT, size: SZ, bold: true, text: 'о практике производственной, технологической' })],
      alignment: AlignmentType.CENTER,
      indent: { left: 709, firstLine: 0 },
      spacing: { before: 279, line: 240, lineRule: 'auto' },
    }),
    empty(),
    empty(200),
    new Paragraph({
      children: [
        new TextRun({ font: FONT, size: SZ, bold: true, text: 'Тема задания: ' }),
        new TextRun({ font: FONT, size: SZ, text: '«Разработка клиентской части системы управления образовательной программы»' }),
      ],
      alignment: AlignmentType.LEFT,
      indent: { left: 141, right: 1655, firstLine: 0 },
      spacing: { line: 240, lineRule: 'auto' },
    }),
    empty(),
    leftBoldNormal('Обучающийся ', 'Олейник Михаил Олегович, № группы K4241'),
    empty(),
    empty(),
    new Paragraph({
      children: [
        new TextRun({ font: FONT, size: SZ, bold: true, text: 'Руководитель практики от университета: ' }),
        new TextRun({ font: FONT, size: SZ, text: 'Береснев Артем Дмитриевич, доцент, к.т.н, ст. пр.' }),
      ],
      alignment: AlignmentType.LEFT,
      indent: { left: 141, firstLine: 0 },
      spacing: { line: 240, lineRule: 'auto' },
    }),
    empty(),
    empty(),
    empty(),
    empty(),
    empty(),
    empty(),
    empty(),
    empty(),
    empty(138),
    new Paragraph({
      children: [new TextRun({ font: FONT, size: SZ, text: 'Санкт-Петербург' })],
      alignment: AlignmentType.CENTER,
      indent: { left: 3714, right: 3705, firstLine: 0 },
      spacing: { line: 240, lineRule: 'auto' },
    }),
    new Paragraph({
      children: [new TextRun({ font: FONT, size: SZ, text: '2026' })],
      alignment: AlignmentType.CENTER,
      indent: { left: 3714, right: 3705, firstLine: 0 },
      spacing: { line: 240, lineRule: 'auto' },
    }),
  ];
}

/* ═══════════════════════════════════════════
   TOC
   ═══════════════════════════════════════════ */
function tocEntry(text, page, level = 0) {
  const indent = level === 0 ? 141 : 916;
  return new Paragraph({
    children: [
      new TextRun({ font: FONT, size: SZ, text }),
      new TextRun({ font: FONT, size: SZ, text: `  ${'.'.repeat(80)}  ${page}` }),
    ],
    spacing: { line: 240, lineRule: 'auto', before: level === 0 ? 221 : 221 },
    indent: { left: indent, firstLine: 0 },
  });
}

/* ═══════════════════════════════════════════
   BUILD DOCUMENT
   ═══════════════════════════════════════════ */
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: SZ },
        paragraph: {
          spacing: { line: 240, lineRule: 'auto' },
        },
      },
    },
  },
  sections: [
    /* ── Section 1: Title page (no footer/page numbers) ── */
    {
      properties: {
        page: {
          margin: { top: 980, bottom: 280, left: 1275, right: 708 },
          size: { width: 11940, height: 16860 },
        },
      },
      children: titlePage(),
    },
    /* ── Section 2+: Main content with footer ── */
    {
      properties: {
        page: {
          margin: { top: 1060, bottom: 1040, left: 1275, right: 708 },
          size: { width: 11940, height: 16860 },
          pageNumbers: { start: 2 },
        },
      },
      headers: {
        default: new Header({ children: [] }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ font: FONT, size: 24, children: [PageNumber.CURRENT] })],
            }),
          ],
        }),
      },
      children: [
        /* ═══ РЕФЕРАТ ═══ */
        heading1('РЕФЕРАТ'),
        new Paragraph({
          children: [new TextRun({ font: FONT, size: SZ, text: 'Отчёт 24 с., 14 рис., 15 источн.' })],
          spacing: { line: 240, lineRule: 'auto', before: 161 },
          indent: { left: 1132, firstLine: 0 },
        }),
        body('ВЕБ-ПРИЛОЖЕНИЕ, КЛИЕНТСКАЯ ЧАСТЬ, REACT, TYPESCRIPT, SPA, OAUTH, ГРАФ ЗАВИСИМОСТЕЙ, REST API, КОМПОНЕНТНАЯ АРХИТЕКТУРА, REACT FLOW.', { before: 160, firstLine: 712 }),
        body('Данный отчёт по практике описывает разработку клиентской части системы управления образовательной программой, которая показывает учебные планы, связи между дисциплинами и позволяет управлять студентами и ролями пользователей.', { firstLine: 712 }),
        body('Цель работы \u2013 сделать рабочее веб-приложение, через которое можно просматривать и редактировать учебные планы в виде графа, управлять когортами студентов, входить через OAuth-провайдеров и разграничивать доступ по ролям.', { firstLine: 712 }),
        body('В ходе практики реализовано одностраничное приложение (SPA) на React 19 и TypeScript с графовым редактором учебных планов, модулем управления студентами, OAuth2 PKCE авторизацией и интеграцией с серверным REST API. Приложение развёрнуто в тестовой среде и проверено совместно с серверной частью.', { firstLine: 712 }),
        pageBreak(),

        /* ═══ СОДЕРЖАНИЕ ═══ */
        heading1('СОДЕРЖАНИЕ'),
        tocEntry('РЕФЕРАТ', '2'),
        tocEntry('ВВЕДЕНИЕ', '4'),
        tocEntry('1. Постановка задачи и организация разработки', '6', 0),
        tocEntry('1.1 Постановка задачи', '6', 1),
        tocEntry('1.2 Выполненная реализация', '6', 1),
        tocEntry('1.3 Развёртывание и проверка', '7', 1),
        tocEntry('2. Проектирование клиентской части системы', '8', 0),
        tocEntry('2.1 Архитектура приложения', '8', 1),
        tocEntry('2.2 Структура проекта', '9', 1),
        tocEntry('2.3 Маршрутизация', '10', 1),
        tocEntry('2.4 Взаимодействие с REST API', '10', 1),
        tocEntry('3. Реализация клиентской части системы', '12', 0),
        tocEntry('3.1 Аутентификация', '12', 1),
        tocEntry('3.2 Граф зависимостей дисциплин', '14', 1),
        tocEntry('3.3 Управление студентами', '17', 1),
        tocEntry('3.4 Управление ролями', '18', 1),
        tocEntry('3.5 Каталог контактов и профиль', '19', 1),
        tocEntry('3.6 Система уведомлений', '19', 1),
        tocEntry('4. Развёртывание и проверка', '20', 0),
        tocEntry('4.1 Сборка и запуск', '20', 1),
        tocEntry('4.2 Прокси и CORS', '20', 1),
        tocEntry('4.3 Совместная проверка', '21', 1),
        tocEntry('ЗАКЛЮЧЕНИЕ', '22'),
        tocEntry('СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ', '23'),
        pageBreak(),

        /* ═══ ВВЕДЕНИЕ ═══ */
        heading1('ВВЕДЕНИЕ'),
        body('В образовательных программах данные об учебном плане, дисциплинах, студентах и ходе обучения часто хранятся в разных местах: таблицах, документах и переписках. Из-за этого сложно быстро получить нужную информацию и принять решение.', { before: 161, firstLine: 712 }),
        body('Чтобы собрать всё в одном месте, нужен единый сервис, который покажет структуру учебного плана, связи между дисциплинами, список студентов по когортам и позволит назначать роли пользователям.', { firstLine: 712 }),
        body('Цель практики \u2013 реализовать клиентскую часть системы управления образовательной программой: одностраничное веб-приложение с интерактивным графом дисциплин, авторизацией через OAuth и интеграцией с серверным API.', { firstLine: 712 }),
        new Paragraph({
          children: [new TextRun({ font: FONT, size: SZ, text: 'Для достижения цели решены следующие задачи:' })],
          spacing: { line: 240, lineRule: 'auto', before: 1 },
          indent: { left: 1139, firstLine: 0 },
        }),
        listItem('выбрать технологический стек и спроектировать архитектуру приложения,', 1),
        listItem('реализовать интерактивный граф зависимостей дисциплин с редактированием,', 2),
        listItem('реализовать авторизацию через OAuth2 PKCE с автообновлением токенов,', 3),
        listItem('реализовать модули управления студентами, ролями и профилем,', 4),
        listItem('интегрировать клиент с серверным REST API и проверить работу,', 5),
        listItem('развернуть приложение в тестовой среде и провести совместную проверку с сервером.', 6),
        body('Серверная часть системы (база данных, API) разработана другим участником команды и описана в отдельном отчёте [1]. Данный отчёт посвящён только клиентской части.', { firstLine: 712, before: 161 }),
        body('Отчёт состоит из четырёх разделов. В первом описана постановка задачи и что конкретно было сделано. Во втором \u2013 архитектура и проектные решения. В третьем \u2013 подробное описание реализации каждого модуля. В четвёртом \u2013 сборка, развёртывание и проверка.', { firstLine: 712 }),
        pageBreak(),

        /* ═══ 1. ПОСТАНОВКА ЗАДАЧИ ═══ */
        heading1('1 Постановка задачи и организация разработки'),

        heading2('1.1 Постановка задачи'),
        body('Задача \u2013 сделать клиентскую часть (фронтенд) системы управления образовательной программой. Это одностраничное приложение (SPA), которое работает в браузере и обращается к серверному REST API [2] за данными.'),
        body('Система нужна сотрудникам университета: руководителям программ, менеджерам когорт и администраторам. У каждой роли свой уровень доступа.'),
        body('Приложение должно уметь:'),
        dashItem('показывать учебный план в виде графа, где дисциплины \u2013 это узлы, а зависимости между ними \u2013 связи;'),
        dashItem('давать возможность редактировать граф: добавлять и удалять дисциплины и связи;'),
        dashItem('управлять списком студентов в когорте: добавлять, удалять, назначать специализации;'),
        dashItem('входить в систему через OAuth-провайдеров (Яндекс, Google, ИТМО);'),
        dashItem('разграничивать доступ к функциям по ролям.'),

        heading2('1.2 Выполненная реализация'),
        body('В ходе практики реализованы следующие модули:'),
        dashItem([{ text: 'Авторизация ', bold: true }, { text: '\u2013 вход через Яндекс OAuth2 PKCE, автоматическое обновление токенов, выход из системы;' }]),
        dashItem([{ text: 'Граф учебного плана ', bold: true }, { text: '\u2013 интерактивная визуализация на React Flow с автораскладкой Dagre, добавление/удаление узлов и рёбер, проверка связности, режим сравнения версий;' }]),
        dashItem([{ text: 'Управление студентами ', bold: true }, { text: '\u2013 список студентов когорты, назначение специализаций, добавление и удаление;' }]),
        dashItem([{ text: 'Управление ролями ', bold: true }, { text: '\u2013 список пользователей, назначение ролей (профессор, редактор, студент, админ, староста);' }]),
        dashItem([{ text: 'Каталог контактов ', bold: true }, { text: '\u2013 карточки пользователей с аватарами и статусами;' }]),
        dashItem([{ text: 'Профиль ', bold: true }, { text: '\u2013 просмотр и редактирование Telegram и телефона;' }]),
        dashItem([{ text: 'Уведомления ', bold: true }, { text: '\u2013 Toast-уведомления четырёх типов с автозакрытием.' }]),

        heading2('1.3 Развёртывание и проверка'),
        body('Приложение развёрнуто локально через Vite dev-сервер (порт 5173) с прокси на серверную часть (порт 5000). Проведена совместная проверка: авторизация, загрузка графа, редактирование, управление студентами. Все проверенные сценарии работают.'),
        pageBreak(),

        /* ═══ 2. ПРОЕКТИРОВАНИЕ ═══ */
        heading1('2 Проектирование клиентской части системы'),

        heading2('2.1 Архитектура приложения'),
        body('Приложение построено по компонентной архитектуре. Код разделён на пять слоёв, каждый отвечает за своё (рисунок 1):'),
        dashItem([{ text: 'pages/ ', bold: true }, { text: '\u2013 страницы приложения, каждая реализует один экран;' }], { before: 160 }),
        dashItem([{ text: 'components/ ', bold: true }, { text: '\u2013 переиспользуемые элементы: узлы графа, панели, навигация;' }]),
        dashItem([{ text: 'contexts/ ', bold: true }, { text: '\u2013 глобальное состояние через React Context API (авторизация);' }]),
        dashItem([{ text: 'api/ ', bold: true }, { text: '\u2013 HTTP-клиент и типизированные функции запросов к серверу;' }]),
        dashItem([{ text: 'utils/ ', bold: true }, { text: '\u2013 вспомогательные функции (алгоритм раскладки графа).' }]),
        imgPlaceholder(1, 'Схема архитектуры: pages → components → contexts → api → utils'),
        figCaption(1, 'Архитектура клиентского приложения'),
        body('Точка входа \u2013 файл main.tsx, который монтирует корневой компонент App. App оборачивает маршруты в провайдеры AuthProvider (авторизация) и ToastProvider (уведомления).'),
        body('Компонент MainLayout задаёт общую компоновку: боковая панель навигации (Sidebar, 260px), верхняя панель (Header, 60px) и область контента, куда React Router подставляет текущую страницу.'),
        body('Для управления состоянием используется React Context API и локальный useState в компонентах. Сторонние библиотеки для стейт-менеджмента (Redux, Zustand) не применяются, так как объём глобального состояния невелик \u2013 по сути только данные авторизации.'),
        imgPlaceholder(2, 'Скриншот MainLayout: Sidebar + Header + контент'),
        figCaption(2, 'Компоновка интерфейса (MainLayout)'),
        pageBreak(),

        heading2('2.2 Структура проекта'),
        body('Файловая структура проекта (рисунок 3):'),
        ...codeLines([
          'src/',
          '├── main.tsx              # Точка входа',
          '├── App.tsx               # Маршруты',
          '├── index.css             # Глобальные стили, CSS-переменные',
          '├── api/',
          '│   ├── client.ts         # Axios с интерсепторами',
          '│   ├── types.ts          # TypeScript-интерфейсы',
          '│   ├── programs.ts       # API программ',
          '│   ├── cohorts.ts        # API когорт',
          '│   ├── courses.ts        # API дисциплин',
          '│   ├── students.ts       # API студентов',
          '│   └── faculties.ts      # API факультетов',
          '├── components/',
          '│   ├── Header/           # Верхняя панель',
          '│   ├── Sidebar/          # Боковая навигация',
          '│   ├── ProtectedRoute/   # Защита маршрутов',
          '│   ├── CourseNode/       # Узел графа',
          '│   ├── CourseDetailPanel/ # Панель деталей дисциплины',
          '│   └── Toast/            # Система уведомлений',
          '├── contexts/',
          '│   └── AuthContext.tsx    # Контекст авторизации',
          '├── layouts/',
          '│   └── MainLayout/       # Sidebar + Header + Outlet',
          '├── pages/',
          '│   ├── LoginPage/        # Вход (OAuth)',
          '│   ├── AuthCallbackPage/ # OAuth callback',
          '│   ├── DashboardPage/    # Граф дисциплин',
          '│   ├── ContactsPage/     # Контакты',
          '│   ├── StudentsJournalPage/ # Студенты когорты',
          '│   ├── RoleManagementPage/  # Роли',
          '│   ├── DataUploadPage/   # Загрузка данных',
          '│   └── ProfilePage/      # Профиль',
          '└── utils/',
          '    └── graphLayout.ts    # Алгоритм раскладки Dagre',
        ]),
        figCaption(3, 'Файловая структура проекта'),
        body('Стили написаны через CSS Modules \u2013 каждый компонент имеет свой .module.css файл. Глобальные CSS-переменные (цвета, отступы, размеры) определены в index.css. Основной цвет \u2013 #135BEC, шрифт \u2013 Inter.'),
        pageBreak(),

        heading2('2.3 Маршрутизация'),
        body('Маршрутизация сделана через React Router DOM 7 с вложенными маршрутами [3]. Таблица 1 показывает все маршруты.'),
        new Paragraph({
          children: [new TextRun({ font: FONT, size: SZ, text: 'Таблица 1 \u2013 Маршруты приложения' })],
          spacing: { line: LINE, lineRule: 'auto', before: 160 },
          alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              tCell('Путь', { bold: true, width: 22 }),
              tCell('Компонент', { bold: true, width: 28 }),
              tCell('Доступ', { bold: true, width: 20 }),
              tCell('Описание', { bold: true, width: 30 }),
            ]}),
            ...[
              ['/login', 'LoginPage', 'Публичный', 'Страница входа'],
              ['/auth/callback', 'AuthCallbackPage', 'Публичный', 'OAuth callback'],
              ['/', '→ /dashboard', 'Защищённый', 'Редирект'],
              ['/dashboard', 'DashboardPage', 'Защищённый', 'Граф дисциплин'],
              ['/contacts', 'ContactsPage', 'Защищённый', 'Контакты'],
              ['/students', 'StudentsJournalPage', 'Защищённый', 'Журнал студентов'],
              ['/data-upload', 'DataUploadPage', 'Защищённый', 'Загрузка данных'],
              ['/roles', 'RoleManagementPage', 'Защищённый', 'Роли'],
              ['/profile', 'ProfilePage', 'Защищённый', 'Профиль'],
            ].map(([p, c, a, d]) => new TableRow({ children: [
              tCell(p, { font: 'Courier New', sz: 22 }), tCell(c), tCell(a), tCell(d),
            ]})),
          ],
        }),
        body('Защищённые маршруты обёрнуты компонентом ProtectedRoute, который проверяет, есть ли авторизованный пользователь в AuthContext. Если нет \u2013 перенаправляет на /login.', { before: 160 }),

        heading2('2.4 Взаимодействие с REST API'),
        body('Клиент общается с сервером через Axios [4]. HTTP-клиент настроен с базовым URL /api/v1, который через прокси Vite перенаправляется на сервер (127.0.0.1:5000).'),
        body('Таблица 2 показывает основные эндпоинты, которые использует клиент.'),
        new Paragraph({
          children: [new TextRun({ font: FONT, size: SZ, text: 'Таблица 2 \u2013 Эндпоинты REST API' })],
          spacing: { line: LINE, lineRule: 'auto', before: 160 },
          alignment: AlignmentType.CENTER, indent: { firstLine: 0 },
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [
              tCell('Метод', { bold: true, width: 12 }),
              tCell('Эндпоинт', { bold: true, width: 38 }),
              tCell('Описание', { bold: true, width: 50 }),
            ]}),
            ...[
              ['GET', '/program', 'Список программ'],
              ['GET', '/program/{id}', 'Программа с когортами'],
              ['POST', '/program', 'Создание программы'],
              ['GET', '/cohort/{id}/graph', 'Граф учебного плана'],
              ['PUT', '/cohort/{id}/graph', 'Сохранение учебного плана'],
              ['GET', '/cohort/{id}/students', 'Студенты когорты'],
              ['PUT', '/cohort/{id}/students', 'Обновление специализаций'],
              ['PUT', '/course/{id}', 'Обновление дисциплины'],
              ['POST', '/student', 'Добавление студента'],
              ['DELETE', '/student/{id}', 'Удаление студента'],
              ['GET', '/faculty', 'Список факультетов'],
              ['GET', '/user/{id}', 'Данные пользователя'],
              ['PUT', '/user/{id}', 'Обновление профиля'],
              ['POST', '/auth/token/{prov}', 'Обмен OAuth code на токен'],
              ['POST', '/auth/token/refresh', 'Обновление токена'],
            ].map(([m, e, d]) => new TableRow({ children: [
              tCell(m), tCell(e, { font: 'Courier New', sz: 20 }), tCell(d, { align: AlignmentType.LEFT }),
            ]})),
          ],
        }),
        body('Типы данных, которые приходят от API, описаны в файле types.ts как TypeScript-интерфейсы: UserBase, ProgramBase, CohortBase, CourseBase, EducationPlanGraph и другие. Это позволяет ловить ошибки ещё при написании кода, а не в рантайме [5].', { before: 160 }),
        pageBreak(),

        /* ═══ 3. РЕАЛИЗАЦИЯ ═══ */
        heading1('3 Реализация клиентской части системы'),

        heading2('3.1 Аутентификация'),
        body('Авторизация работает по протоколу OAuth2 Authorization Code Flow с PKCE \u2013 это безопасный способ для приложений, работающих в браузере [6]. Сейчас поддерживается вход через Яндекс, остальные провайдеры (Google, ИТМО) подготовлены, но ещё не подключены на сервере.'),
        body('Как работает вход (рисунок 4):'),
        listItem('Пользователь на странице LoginPage (рисунок 5) нажимает кнопку провайдера.', 1),
        listItem('Клиент отправляет GET /auth/login?provider=yandex на сервер и получает URL для авторизации, code_verifier и code_challenge.', 2),
        listItem('code_verifier сохраняется в sessionStorage.', 3),
        listItem('Браузер перенаправляется на страницу Яндекса.', 4),
        listItem('После входа Яндекс возвращает code на /auth/callback.', 5),
        listItem('AuthCallbackPage берёт code из URL и отправляет POST /api/v1/auth/token/yandex с code и code_verifier.', 6),
        listItem('Сервер возвращает access_token, refresh_token и данные пользователя.', 7),
        listItem('Всё сохраняется в AuthContext и localStorage.', 8),
        imgPlaceholder(4, 'Диаграмма последовательности OAuth2 PKCE'),
        figCaption(4, 'Поток авторизации OAuth2 PKCE'),
        imgPlaceholder(5, 'Страница логина с кнопками провайдеров'),
        figCaption(5, 'Страница входа в систему'),
        body('Управление сессией сделано через React Context (AuthContext.tsx). При загрузке приложения проверяется, есть ли токен в localStorage. Если есть \u2013 данные пользователя загружаются с сервера, чтобы обновить их.'),
        body('Автообновление токенов работает через интерсептор Axios в файле client.ts. Когда сервер отвечает 401 (токен просрочен), интерсептор автоматически отправляет refresh_token и получает новый access_token. Если обновить не удалось \u2013 пользователь выходит из системы. Параллельные запросы, получившие 401, ставятся в очередь и повторяются после обновления [7].'),
        pageBreak(),

        heading2('3.2 Граф зависимостей дисциплин'),
        body('Главная функция приложения \u2013 интерактивный редактор графа зависимостей дисциплин (DashboardPage, рисунок 6). Он сделан на библиотеке React Flow [8].'),
        imgPlaceholder(6, 'DashboardPage \u2013 граф дисциплин с узлами и связями'),
        figCaption(6, 'Интерактивный граф зависимостей дисциплин'),
        body('Граф показывает учебный план как направленный ациклический граф (DAG): дисциплины \u2013 узлы, зависимости \u2013 рёбра. Каждый узел показывает код дисциплины, название, семестр и кредиты.'),
        body('Чтобы выбрать учебный план, пользователь последовательно выбирает факультет, программу и когорту (год поступления) через выпадающие списки. Данные загружаются с сервера.'),
        body([{ text: 'Узлы графа. ', bold: true }, { text: 'Каждая дисциплина \u2013 это кастомный компонент CourseNode (рисунок 7). Обязательные дисциплины отмечены синим, элективные \u2013 оранжевым. Узел «ВКР» (выпускная работа) обрабатывается особо: у него не может быть исходящих рёбер, но должно быть хотя бы одно входящее.' }]),
        imgPlaceholder(7, 'Узлы дисциплин: обязательная (синий) и элективная (оранжевый)'),
        figCaption(7, 'Кастомные узлы дисциплин'),
        body([{ text: 'Автоматическая раскладка. ', bold: true }, { text: 'Когда граф загружается, узлы автоматически расставляются алгоритмом Dagre [9] \u2013 он умеет красиво раскладывать направленные графы. Настройки: направление «сверху вниз», расстояние между узлами 50px, между уровнями 70px, размер узла 220\u00d7115px.' }]),
        body([{ text: 'Проверка графа. ', bold: true }, { text: 'При каждом изменении автоматически проверяется, что каждый узел (кроме ВКР) имеет хотя бы одно исходящее ребро, а ВКР \u2013 хотя бы одно входящее. Узлы без связей помечаются предупреждением. Также проверяется отсутствие циклов.' }]),
        body([{ text: 'Панель деталей. ', bold: true }, { text: 'Если нажать на узел, справа открывается панель CourseDetailPanel (рисунок 8): код, название, семестр, кредиты, форма обучения, преподаватели, материалы и студенты. Можно редактировать свойства \u2013 изменения сохраняются через API.' }]),
        imgPlaceholder(8, 'CourseDetailPanel \u2013 детали выбранной дисциплины'),
        figCaption(8, 'Панель деталей дисциплины'),
        body([{ text: 'Режим сравнения. ', bold: true }, { text: 'Можно сравнить текущий план с сохранённой версией (рисунок 9). Добавленные узлы выделяются зелёным, удалённые \u2013 серым, неизменённые \u2013 обычным цветом.' }]),
        imgPlaceholder(9, 'Режим сравнения двух версий плана'),
        figCaption(9, 'Режим сравнения учебных планов'),
        pageBreak(),

        heading2('3.3 Управление студентами'),
        body('Страница StudentsJournalPage (рисунок 10) позволяет работать со студентами конкретной когорты.'),
        imgPlaceholder(10, 'StudentsJournalPage \u2013 таблица студентов'),
        figCaption(10, 'Журнал студентов когорты'),
        body('Что можно делать:'),
        dashItem([{ text: 'Выбрать когорту ', bold: true }, { text: 'через фильтры: программа \u2192 когорта. Данные загружаются с сервера.' }], { before: 160 }),
        dashItem([{ text: 'Посмотреть список студентов ', bold: true }, { text: 'с ФИО, email и специализацией.' }]),
        dashItem([{ text: 'Назначить специализацию ', bold: true }, { text: '\u2013 для каждого студента есть выпадающий список.' }]),
        dashItem([{ text: 'Добавить студента ', bold: true }, { text: '\u2013 через модальное окно с указанием ID пользователя.' }]),
        dashItem([{ text: 'Удалить студента ', bold: true }, { text: 'из когорты с подтверждением.' }]),
        body('Все выпадающие списки написаны вручную, без сторонних UI-библиотек.'),

        heading2('3.4 Управление ролями'),
        body('Страница RoleManagementPage (рисунок 11) для администраторов \u2013 здесь можно управлять ролями пользователей.'),
        imgPlaceholder(11, 'RoleManagementPage \u2013 список пользователей с ролями'),
        figCaption(11, 'Управление ролями пользователей'),
        body('Показывается список пользователей с их ролями: профессор, редактор, студент, администратор, староста. Для каждого можно изменить набор ролей и статус (активен, в отпуске, неактивен) через модальное окно.'),
        pageBreak(),

        heading2('3.5 Каталог контактов и профиль'),
        body('ContactsPage (рисунок 12) \u2013 каталог контактов. Каждый пользователь показан карточкой с аватаром, именем, группой и статусом (онлайн/оффлайн). Есть поиск.'),
        imgPlaceholder(12, 'ContactsPage \u2013 карточки контактов'),
        figCaption(12, 'Каталог контактов'),
        body('ProfilePage (рисунок 13) \u2013 профиль пользователя. Показывает имя, фамилию, email, ISU ID. Можно изменить Telegram и телефон \u2013 при сохранении отправляется PUT-запрос на сервер.'),
        imgPlaceholder(13, 'ProfilePage \u2013 форма профиля'),
        figCaption(13, 'Профиль пользователя'),

        heading2('3.6 Система уведомлений'),
        body('Для обратной связи с пользователем сделана система Toast-уведомлений. Компонент ToastProvider даёт хук useToast, через который можно показать уведомление из любого компонента.'),
        body('Есть четыре типа: success (зелёный), error (красный), warning (жёлтый) и info (синий). Уведомления сами закрываются через 3 секунды, можно закрыть и по клику.'),
        pageBreak(),

        /* ═══ 4. РАЗВЁРТЫВАНИЕ ═══ */
        heading1('4 Развёртывание и проверка'),

        heading2('4.1 Сборка и запуск'),
        body('Сборка делается командой npm run build, которая запускает два шага:'),
        listItem('Проверка типов TypeScript (tsc -b) \u2013 проверяет, что нет ошибок в типах.', 1),
        listItem('Сборка Vite \u2013 собирает код в оптимизированный бандл с минификацией и хешированием файлов.', 2),
        body('Для разработки используется npm run dev \u2013 запускает dev-сервер на порту 5173 с горячей перезагрузкой [10]. Результат сборки попадает в папку dist/ и может быть развёрнут на любом веб-сервере.'),
        imgPlaceholder(14, 'Вывод npm run build \u2013 успешная сборка'),
        figCaption(14, 'Успешная сборка проекта'),

        heading2('4.2 Прокси и CORS'),
        body('В режиме разработки Vite работает как прокси: запросы на /api/v1 перенаправляются на сервер (127.0.0.1:5000). Конфигурация в vite.config.ts:'),
        ...codeLines([
          'server: {',
          '  port: 5173,',
          '  host: "127.0.0.1",',
          '  proxy: {',
          '    \'/api/v1\': {',
          '      target: \'http://127.0.0.1:5000\',',
          '      changeOrigin: true,',
          '    },',
          '    \'/auth/token\': { ... },',
          '    \'/auth/login\': { ... },',
          '  },',
          '}',
        ]),
        body('Это позволяет обращаться к API по относительным путям и не сталкиваться с проблемами CORS [11]. В продакшене то же самое делает обратный прокси (например, Nginx).', { before: 160 }),

        heading2('4.3 Совместная проверка'),
        body('Проверка проводилась вместе с серверной частью. Проверены сценарии:'),
        dashItem([{ text: 'Авторизация: ', bold: true }, { text: 'вход через Яндекс, получение токена, автообновление, выход.' }], { before: 160 }),
        dashItem([{ text: 'Загрузка данных: ', bold: true }, { text: 'списки факультетов, программ, когорт загружаются и отображаются правильно.' }]),
        dashItem([{ text: 'Граф: ', bold: true }, { text: 'загрузка, автораскладка, добавление/удаление узлов и рёбер, сохранение на сервер.' }]),
        dashItem([{ text: 'Студенты: ', bold: true }, { text: 'загрузка списка, назначение специализаций, добавление и удаление.' }]),
        dashItem([{ text: 'Профиль: ', bold: true }, { text: 'обновление Telegram и телефона сохраняется через API.' }]),
        body('Все проверенные сценарии работают без ошибок.'),
        pageBreak(),

        /* ═══ ЗАКЛЮЧЕНИЕ ═══ */
        heading1('ЗАКЛЮЧЕНИЕ'),
        body('В ходе практики реализована клиентская часть системы управления образовательной программой. Сделано одностраничное приложение, через которое можно смотреть и редактировать учебные планы, управлять студентами, назначать роли и входить через OAuth.', { before: 161, firstLine: 712 }),
        body('Что сделано:', { firstLine: 712 }),
        listItem('Спроектирована и реализована компонентная архитектура на React 19 и TypeScript.', 1),
        listItem('Сделан интерактивный графовый редактор учебных планов на React Flow с автораскладкой Dagre и режимом сравнения.', 2),
        listItem('Реализована авторизация OAuth2 PKCE с автоматическим обновлением токенов.', 3),
        listItem('Реализованы модули управления студентами, ролями, каталог контактов и профиль.', 4),
        listItem('Клиент интегрирован с серверным REST API через типизированные модули Axios.', 5),
        listItem('Приложение развёрнуто и проверено совместно с серверной частью.', 6),
        body('Приложение готово к дальнейшему развитию: подключение остальных OAuth-провайдеров, реализация загрузки данных, расширение ролевой модели. Компонентная архитектура и TypeScript позволяют безопасно добавлять новый функционал.', { firstLine: 712 }),
        pageBreak(),

        /* ═══ ИСТОЧНИКИ ═══ */
        heading1('СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ'),
        ...[
          '1. Отчёт по серверной части системы управления образовательной программой / Олейник М. О. \u2013 Университет ИТМО, 2026.',
          '2. Что такое REST API \u2013 RESTful-интерфейс прикладного программирования [Электронный ресурс]. \u2013 URL: https://habr.com/ru/articles/483202 (дата обращения: 13.04.2026).',
          '3. React Router Documentation [Электронный ресурс]. \u2013 URL: https://reactrouter.com/en/main (дата обращения: 13.04.2026).',
          '4. Axios \u2013 Promise-based HTTP client [Электронный ресурс]. \u2013 URL: https://axios-http.com/docs/intro (дата обращения: 13.04.2026).',
          '5. TypeScript Documentation [Электронный ресурс]. \u2013 URL: https://www.typescriptlang.org/docs/ (дата обращения: 13.04.2026).',
          '6. RFC 7636 \u2013 Proof Key for Code Exchange by OAuth Public Clients [Электронный ресурс]. \u2013 URL: https://datatracker.ietf.org/doc/html/rfc7636 (дата обращения: 13.04.2026).',
          '7. Подходы к аутентификации в SPA-приложениях [Электронный ресурс]. \u2013 URL: https://habr.com/ru/companies/vk/articles/532996 (дата обращения: 14.04.2026).',
          '8. React Flow \u2013 A customizable React component for building node-based editors [Электронный ресурс]. \u2013 URL: https://reactflow.dev/learn (дата обращения: 14.04.2026).',
          '9. Dagre \u2013 Directed graph layout for JavaScript [Электронный ресурс]. \u2013 URL: https://github.com/dagrejs/dagre (дата обращения: 14.04.2026).',
          '10. Vite \u2013 Next Generation Frontend Tooling [Электронный ресурс]. \u2013 URL: https://vite.dev/guide/ (дата обращения: 14.04.2026).',
          '11. MDN Web Docs \u2013 Cross-Origin Resource Sharing (CORS) [Электронный ресурс]. \u2013 URL: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS (дата обращения: 14.04.2026).',
          '12. React Documentation \u2013 Getting Started [Электронный ресурс]. \u2013 URL: https://react.dev/learn (дата обращения: 14.04.2026).',
          '13. OAuth 2.0 и OpenID Connect: основные понятия и механизмы [Электронный ресурс]. \u2013 URL: https://habr.com/ru/companies/ozontech/articles/825008 (дата обращения: 14.04.2026).',
          '14. JSON Web Tokens \u2013 Introduction [Электронный ресурс]. \u2013 URL: https://jwt.io/introduction (дата обращения: 14.04.2026).',
          '15. CSS Custom Properties \u2013 MDN Web Docs [Электронный ресурс]. \u2013 URL: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties (дата обращения: 14.04.2026).',
        ].map((src, i) => new Paragraph({
          children: [new TextRun({ font: FONT, size: SZ, text: src })],
          spacing: { line: LINE, lineRule: 'auto', before: i === 0 ? 161 : 0 },
          alignment: AlignmentType.JUSTIFIED,
          indent: { left: 427, firstLine: 0, right: 150 },
        })),
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);

/* ── Post-process: fix styles.xml to remove blue heading colors and match template ── */
import AdmZip from 'adm-zip';
const zip = new AdmZip(Buffer.from(buffer));

const templateStylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="22"/><w:szCs w:val="22"/>
      <w:lang w:val="ru-RU" w:eastAsia="en-US" w:bidi="ar-SA"/>
    </w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr>
      <w:widowControl w:val="0"/>
      <w:autoSpaceDE w:val="0"/><w:autoSpaceDN w:val="0"/>
      <w:spacing w:lineRule="auto" w:line="240" w:before="0" w:after="0"/>
      <w:ind w:left="0" w:right="0"/>
      <w:jc w:val="left"/>
    </w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:styleId="DefaultParagraphFont" w:default="1" w:type="character">
    <w:name w:val="Default Paragraph Font"/>
    <w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/>
  </w:style>
  <w:style w:styleId="TableNormal" w:default="1" w:type="table">
    <w:name w:val="Table Normal"/>
    <w:uiPriority w:val="2"/><w:semiHidden/><w:unhideWhenUsed/><w:qFormat/>
    <w:tblPr><w:tblInd w:w="0" w:type="dxa"/>
      <w:tblCellMar>
        <w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/>
        <w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/>
      </w:tblCellMar>
    </w:tblPr>
  </w:style>
  <w:style w:default="1" w:styleId="Normal" w:type="paragraph">
    <w:name w:val="Normal"/><w:uiPriority w:val="1"/><w:qFormat/>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>
      <w:lang w:val="ru-RU" w:eastAsia="en-US" w:bidi="ar-SA"/>
    </w:rPr>
  </w:style>
  <w:style w:styleId="BodyText" w:type="paragraph">
    <w:name w:val="Body Text"/><w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="1"/><w:qFormat/>
    <w:pPr><w:ind w:left="427" w:firstLine="705"/><w:jc w:val="both"/></w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>
      <w:sz w:val="28"/><w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:styleId="Heading1" w:type="paragraph">
    <w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="1"/><w:qFormat/>
    <w:pPr><w:spacing w:before="65"/><w:ind w:left="331"/><w:jc w:val="center"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>
      <w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:styleId="Heading2" w:type="paragraph">
    <w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="1"/><w:qFormat/>
    <w:pPr><w:ind w:left="1546" w:hanging="414"/><w:jc w:val="both"/>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>
      <w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:styleId="Title" w:type="paragraph">
    <w:name w:val="Title"/><w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="1"/><w:qFormat/>
    <w:pPr><w:ind w:left="719"/><w:jc w:val="center"/></w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>
      <w:b/><w:bCs/><w:sz w:val="32"/><w:szCs w:val="32"/>
    </w:rPr>
  </w:style>
  <w:style w:styleId="ListParagraph" w:type="paragraph">
    <w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="1"/><w:qFormat/>
    <w:pPr><w:ind w:left="427" w:firstLine="705"/><w:jc w:val="both"/></w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/>
    </w:rPr>
  </w:style>
  <w:style w:styleId="TableParagraph" w:type="paragraph">
    <w:name w:val="Table Paragraph"/><w:basedOn w:val="Normal"/>
    <w:uiPriority w:val="1"/><w:qFormat/>
    <w:rPr><w:lang w:val="ru-RU" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr>
  </w:style>
</w:styles>`;

zip.updateFile('word/styles.xml', Buffer.from(templateStylesXml, 'utf-8'));

const outPath = 'C:/Users/user/Desktop/Олейник_М_О_Практика_Фронтенд_v3.docx';
zip.writeZip(outPath);
console.log('Done:', outPath);
