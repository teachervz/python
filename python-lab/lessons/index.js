/* سجلّ الدروس المنفَّذة في المنصة. كل درس في ملف مستقل.
   لإضافة درس: أنشئي lessons/lesson_02.js بنفس شكل lesson_01.js، أضيفيه هنا،
   وأضيفي مفاتيحه في apps-script/AnswerKeys.gs، ثم اجعلي «متاح في المنصة» = نعم في ورقة «الدروس». */
export const LESSON_MODULES = {
  lesson_01: () => import('./lesson_01.js')
};

/* بيانات عرض مختصرة لبطاقات المنهج (من curriculum/curriculum_index.json) */
export const LESSON_INFO = {
  lesson_01: { summary: 'نقارن القيم ونربط الشروط لنحصل على True أو False', minutes: 45, pages: '112–121' },
  lesson_02: { summary: 'جملة if البسيطة والمسافة البادئة', minutes: 45, pages: '122–128' },
  lesson_03: { summary: 'if...else و if...elif...else', minutes: 45, pages: '129–137' },
  lesson_04: { summary: 'جمل if داخل جمل if', minutes: 45, pages: '138–143' },
  lesson_05: { summary: 'حلقة for و range وحلقة while و break', minutes: 45, pages: '144–152' },
  lesson_06: { summary: 'حلقة داخل حلقة وطباعة الأنماط', minutes: 45, pages: '153–162' },
  lesson_07: { summary: 'تعريف الدوال والمعاملات والإرجاع', minutes: 45, pages: '163–171' },
  lesson_08: { summary: 'قراءة ملفات إكسل وكتابتها بمكتبة openpyxl', minutes: 45, pages: '172–182' }
};
