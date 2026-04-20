import AdmZip from 'adm-zip';

const zip = new AdmZip('C:/Users/user/Desktop/Олейник_М_О_Практика_Фронтенд_v2.docx');
let docXml = zip.readAsText('word/document.xml');

/* ═══════════════════════════════════════════
   1. Fix blue heading colors in styles.xml
   ═══════════════════════════════════════════ */
let stylesXml = zip.readAsText('word/styles.xml');
// Remove all blue color values from heading styles
stylesXml = stylesXml.replace(/<w:color w:val="2E74B5"\/>/g, '');
stylesXml = stylesXml.replace(/<w:color w:val="1F4D78"\/>/g, '');
// Fix heading sizes to match template (28 = 14pt)
stylesXml = stylesXml.replace(
  /(<w:style[^>]*w:styleId="Heading1"[^>]*>.*?)<w:sz w:val="\d+"\/><w:szCs w:val="\d+"\/>/s,
  '$1<w:sz w:val="28"/><w:szCs w:val="28"/>'
);
stylesXml = stylesXml.replace(
  /(<w:style[^>]*w:styleId="Heading2"[^>]*>.*?)<w:sz w:val="\d+"\/><w:szCs w:val="\d+"\/>/s,
  '$1<w:sz w:val="28"/><w:szCs w:val="28"/>'
);
zip.updateFile('word/styles.xml', Buffer.from(stylesXml, 'utf-8'));

/* ═══════════════════════════════════════════
   2. Build ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ section XML
   ═══════════════════════════════════════════ */
function termParagraph(term, definition) {
  return `<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"/><w:ind w:left="427" w:firstLine="0"/><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">${term}</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve"> \u2013 ${definition}</w:t></w:r></w:p>`;
}

const termsHeading = `<w:p><w:pPr><w:spacing w:before="65"/><w:ind w:left="331" w:right="51" w:firstLine="0"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t>ТЕРМИНЫ И ОПРЕДЕЛЕНИЯ</w:t></w:r></w:p>`;

const terms = [
  ['SPA (Single Page Application)', 'одностраничное приложение, которое загружается один раз и далее обновляет содержимое страницы без полной перезагрузки, обращаясь к серверу только за данными.'],
  ['React', 'JavaScript-библиотека для построения пользовательских интерфейсов на основе компонентного подхода, где каждый элемент интерфейса описывается как независимый компонент.'],
  ['TypeScript', 'язык программирования, расширяющий JavaScript статической типизацией; позволяет находить ошибки на этапе написания кода, а не при запуске.'],
  ['Компонент', 'независимый, переиспользуемый блок интерфейса в React, который принимает входные данные (props) и возвращает описание того, что должно отображаться на экране.'],
  ['REST API', 'стиль проектирования программного интерфейса, в котором данные представлены как ресурсы, доступные по URL, а операции выполняются стандартными HTTP-методами (GET, POST, PUT, DELETE).'],
  ['OAuth2', 'открытый протокол авторизации, позволяющий приложению получить ограниченный доступ к данным пользователя на стороннем сервисе (Яндекс, Google) без передачи пароля.'],
  ['PKCE (Proof Key for Code Exchange)', 'расширение OAuth2 для повышения безопасности в публичных клиентах (браузерных приложениях), использующее одноразовый ключ для подтверждения запроса на получение токена.'],
  ['Токен (access token)', 'строка-ключ, которую клиент передаёт серверу в каждом запросе для подтверждения, что пользователь авторизован; имеет ограниченный срок действия.'],
  ['DAG (Directed Acyclic Graph)', 'направленный ациклический граф \u2013 структура данных, в которой узлы соединены направленными связями без циклов; используется для представления зависимостей между дисциплинами.'],
  ['React Flow', 'JavaScript-библиотека для создания интерактивных узловых графов в браузере с поддержкой перетаскивания, масштабирования и пользовательских узлов.'],
  ['Dagre', 'библиотека для автоматической раскладки направленных графов, которая вычисляет позиции узлов так, чтобы граф был читаемым и без пересечений рёбер.'],
  ['Axios', 'HTTP-клиент для JavaScript, позволяющий отправлять запросы к серверу; поддерживает интерсепторы для автоматической обработки токенов и ошибок.'],
  ['Интерсептор', 'функция-перехватчик в HTTP-клиенте, которая автоматически выполняется перед отправкой запроса или после получения ответа (например, для добавления токена или обновления просроченного).'],
  ['Vite', 'инструмент сборки для веб-приложений с мгновенным запуском dev-сервера и горячей перезагрузкой модулей при изменении кода.'],
  ['CSS Modules', 'способ написания стилей, при котором классы автоматически получают уникальные имена, чтобы стили одного компонента не влияли на другие.'],
  ['localStorage', 'встроенное хранилище браузера, которое сохраняет данные даже после закрытия вкладки; используется для хранения токена авторизации.'],
  ['Прокси (proxy)', 'промежуточный сервер, который перенаправляет запросы; в разработке используется для обхода ограничений CORS при обращении к API.'],
  ['CORS', 'механизм безопасности браузера, который запрещает веб-страницам обращаться к серверам на другом домене без явного разрешения.'],
];

const termsXml = termsHeading +
  `<w:p><w:pPr><w:spacing w:before="161"/></w:pPr></w:p>` +
  terms.map(([t, d]) => termParagraph(t, d)).join('') +
  `<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>`;

/* ═══════════════════════════════════════════
   3. Insert ТЕРМИНЫ before ВВЕДЕНИЕ
   ═══════════════════════════════════════════ */
// Find the actual ВВЕДЕНИЕ heading paragraph (not TOC reference)
// Look for the heading pattern with ВВЕДЕНИЕ text
const introHeadingPattern = /(<w:p[^>]*>(?:<w:pPr>(?:(?!<\/w:pPr>).)*<\/w:pPr>)?(?:<w:bookmarkStart[^\/]*\/>)?(?:<w:bookmarkEnd[^\/]*\/>)?(?:<w:r[^>]*><w:rPr><w:b w:val="0"\/><\/w:rPr><\/w:r>)?<w:r[^>]*>(?:<w:rPr>(?:(?!<\/w:rPr>).)*<\/w:rPr>)?<w:t[^>]*>ВВЕДЕНИЕ<\/w:t><\/w:r><\/w:p>)/;

// Simpler: find the ВВЕДЕНИЕ that's in a heading-style paragraph (the second occurrence)
const allIntro = [...docXml.matchAll(/ВВЕДЕНИЕ/g)];
if (allIntro.length >= 2) {
  // Find the start of the paragraph containing the second ВВЕДЕНИЕ
  const introPos = allIntro[1].index;
  // Go back to find <w:p that starts this paragraph
  let pStart = docXml.lastIndexOf('<w:p', introPos);
  // But we need to find the pageBreak paragraph before it too
  // Look for the pageBreakBefore before the heading
  let searchBack = docXml.lastIndexOf('<w:pageBreakBefore', pStart);
  let actualInsert = pStart;
  if (searchBack > -1 && (pStart - searchBack) < 200) {
    // There's a pageBreak paragraph right before - insert before that
    actualInsert = docXml.lastIndexOf('<w:p', searchBack);
  }

  docXml = docXml.substring(0, actualInsert) + termsXml + docXml.substring(actualInsert);
  console.log('Inserted ТЕРМИНЫ before ВВЕДЕНИЕ');
}

/* ═══════════════════════════════════════════
   4. Replace ЗАКЛЮЧЕНИЕ content with expanded version
   ═══════════════════════════════════════════ */
function bodyP(text, opts = {}) {
  const before = opts.before ? ` w:before="${opts.before}"` : '';
  const firstLine = opts.firstLine ?? 712;
  return `<w:p><w:pPr><w:spacing w:line="360" w:lineRule="auto"${before}/><w:ind w:left="427" w:right="150" w:firstLine="${firstLine}"/><w:jc w:val="both"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

function listP(num, text) {
  return `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="160"/><w:ind w:left="1578" w:hanging="446" w:right="150"/><w:jc w:val="both"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr><w:t xml:space="preserve">${num}. ${text}</w:t></w:r></w:p>`;
}

const expandedConclusion = [
  bodyP('В ходе производственной практики была реализована клиентская часть системы управления данными образовательной программой (РОП) университета. Разработанное одностраничное приложение предоставляет интерфейс для визуализации и редактирования учебных планов, управления когортами студентов, ролевого управления пользователями и аутентификации через OAuth2-провайдеров.', { before: 161 }),
  bodyP('Основные результаты работы:'),
  listP(1, 'Спроектирована и реализована компонентная архитектура приложения на базе React 19 и TypeScript с разделением на пять слоёв: страницы, компоненты, контексты, API-модули и утилиты. Такая структура позволяет добавлять новые модули без переработки существующих.'),
  listP(2, 'Разработан интерактивный графовый редактор учебных планов на базе React Flow. Реализована автоматическая раскладка графа алгоритмом Dagre, проверка корректности связей между дисциплинами (валидация наличия пререквизитов и отсутствия циклов), режим сравнения двух версий учебного плана с цветовой подсветкой различий.'),
  listP(3, 'Реализована система аутентификации по протоколу OAuth2 Authorization Code Flow с расширением PKCE. Поддерживается вход через Яндекс (Google и ИТМО подготовлены). Автоматическое обновление токенов реализовано через интерсептор Axios с очередью параллельных запросов.'),
  listP(4, 'Реализованы модули управления студентами и когортами (добавление, удаление, назначение специализаций), управления ролями пользователей, каталога контактов с аватарами и профиля пользователя с редактированием.'),
  listP(5, 'Обеспечена типобезопасная интеграция с серверным REST API: 15 эндпоинтов покрыты типизированными функциями через Axios. Типы данных (UserBase, CourseBase, EducationPlanGraph и другие) зеркалируют серверные схемы, что позволяет находить ошибки на этапе компиляции.'),
  listP(6, 'Выполнено развёртывание приложения в тестовой среде с Vite dev-сервером и прокси-конфигурацией. Проведена совместная проверка всех реализованных сценариев с серверной частью: авторизация, загрузка и редактирование графа, управление студентами, обновление профиля.'),
  bodyP('Всего реализовано 7 страниц приложения, 6 переиспользуемых компонентов, 6 API-модулей и система Toast-уведомлений. Все элементы интерфейса написаны на чистом CSS Modules без использования сторонних UI-библиотек, что обеспечивает полный контроль над внешним видом и поведением.'),
  bodyP('Разработанное приложение готово к дальнейшему развитию. Ближайшие шаги включают подключение оставшихся OAuth-провайдеров (Google и ИТМО), реализацию модуля загрузки данных (DataUploadPage), расширение ролевой модели с гранулярным управлением доступом к отдельным функциям, а также добавление обработки ошибок API через интерсепторы с повторными попытками.'),
  bodyP('Компонентная архитектура, строгая типизация TypeScript и модульная структура API-слоя обеспечивают возможность безопасного масштабирования кодовой базы. Опыт, полученный в ходе практики, включает работу с React Flow для визуализации графов, реализацию OAuth2 PKCE в браузерном приложении и организацию HTTP-взаимодействия с автоматическим управлением токенами.'),
].join('');

// Find the old conclusion content and replace it
// From the paragraph after ЗАКЛЮЧЕНИЕ heading to the pageBreak before СПИСОК
const conclMatches = [...docXml.matchAll(/ЗАКЛЮЧЕНИЕ/g)];
const srcMatches = [...docXml.matchAll(/СПИСОК ИСПОЛЬЗОВАННЫХ/g)];

if (conclMatches.length >= 2 && srcMatches.length >= 1) {
  const lastConclIdx = conclMatches[conclMatches.length - 1].index;
  const srcIdx = srcMatches[srcMatches.length - 1].index;

  // Find end of ЗАКЛЮЧЕНИЕ heading paragraph
  const headingEnd = docXml.indexOf('</w:p>', lastConclIdx) + 6;

  // Find start of pageBreak paragraph before СПИСОК
  let beforeSrc = docXml.lastIndexOf('<w:p', srcIdx);
  // Check if it's the pageBreak paragraph
  let checkPageBreak = docXml.lastIndexOf('<w:pageBreakBefore', beforeSrc + 100);
  if (checkPageBreak > beforeSrc) {
    // pageBreak is inside this paragraph, so go back one more
  }
  // Actually, find the <w:p that has pageBreakBefore just before СПИСОК heading
  let pageBreakPos = docXml.lastIndexOf('<w:pageBreakBefore', srcIdx);
  let pageBreakParagraphStart = docXml.lastIndexOf('<w:p', pageBreakPos);

  docXml = docXml.substring(0, headingEnd) + expandedConclusion + docXml.substring(pageBreakParagraphStart);
  console.log('Replaced ЗАКЛЮЧЕНИЕ with expanded version');
}

/* ═══════════════════════════════════════════
   5. Save
   ═══════════════════════════════════════════ */
zip.updateFile('word/document.xml', Buffer.from(docXml, 'utf-8'));
const outPath = 'C:/Users/user/Desktop/Олейник_М_О_Практика_Фронтенд_v4.docx';
zip.writeZip(outPath);
console.log('Done:', outPath);
