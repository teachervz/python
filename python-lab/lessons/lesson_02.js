/* =====================================================================
   الدرس الثاني: الجمل الشرطية في البايثون
   المصدر: كتاب المهارات الرقمية – الصف الثاني المتوسط – الوحدة الثالثة (ص122–128)
   محتوى عام: لا يحتوي على إجابات التدريب المستقل (المفاتيح في apps-script/AnswerKeys.gs).

   إضافات على خطوات التتبّع (انظري lesson_01.js):
     skip  أسطر تتخطّاها بايثون (تُشطب في العرض)
     node  الشكل المضيء في المخطط الانسيابي · path  'yes' أو 'no'
   مثال يحتوي input(): inputs = القيم التي تكتبها المستخدمة
   ===================================================================== */

const FLOW_COMPARE = {
  pre: [{ id: 'p', text: 'a=100\nb=20', shape: 'proc' }],
  cond: { id: 'c', text: 'a>b' },
  yes: [{ id: 'y', text: 'print("a أكبر من b")', shape: 'io' }],
  post: [{ id: 'o', text: 'print("استمر في البرمجة")', shape: 'io' }]
};
const FLOW_POSITIVE = {
  pre: [{ id: 'p1', text: 'print("من فضلك أدخل قيمة المتغير x:")', shape: 'io' }, { id: 'p2', text: 'x=int(input())', shape: 'proc' }],
  cond: { id: 'c', text: 'x>0' },
  yes: [{ id: 'y', text: 'print(x,"رقم موجب")', shape: 'io' }],
  post: [{ id: 'o', text: 'print("استمر في البرمجة")', shape: 'io' }]
};

export default {
  id: 'lesson_02',
  number: 2,
  version: 1,
  title: 'الجمل الشرطية في البايثون',
  bookTitle: 'الجمل الشرطية في البايثون',
  bookPages: '122–128',
  estimatedMinutes: 45,
  summary: 'جملة if البسيطة والمسافة البادئة',
  objectives: [
    { id: 'O1', text: 'أتعرّف على أنواع الجمل الشرطية: if و if...else و if...elif' },
    { id: 'O2', text: 'أكتب جملة if البسيطة بصيغتها الصحيحة: الشرط ثم النقطتان (:)' },
    { id: 'O3', text: 'أستخدم المسافة البادئة لتحديد العبارات التي تعتمد على تحقق الشرط' },
    { id: 'O4', text: 'أتتبّع تنفيذ جملة if وأحدد العبارات التي تُنفَّذ والتي تُتخطّى' },
    { id: 'O5', text: 'أربط المخطط الانسيابي بالمقطع البرمجي' },
    { id: 'O6', text: 'أكتب مقطعًا برمجيًا يستجيب لمدخلات المستخدم باستخدام if' }
  ],

  guided: [
    /* ---------------------------------------------------------------- */
    {
      id: 'g1_types',
      type: 'trace',
      title: 'أنواع الجمل الشرطية',
      objectives: ['O1'],
      intro: 'تعرّفتِ على تنفيذ الأوامر بالتتابع واحدًا تلو الآخر، إلّا أنّ اتخاذ القرار أحيانًا يكون تبعًا لطبيعة المشكلة. في هذا الدرس ستكتبين مقاطع برمجية تستجيب لمدخلات المستخدم وتعطي نتائج مختلفة تبعًا للمدخلات، باستخدام <b>الجملة الشرطية <code>if</code></b> (ص122).<br><b>لاحظي:</b> النقطتان <code>:</code> اللتان تليان التعبير الشرطي <b>ضروريتان</b> (ص123).',
      table: {
        head: ['الجملة', 'متى نستخدمها'],
        rows: [['if', 'جملة if الشرطية البسيطة: تُنفَّذ العبارة فقط إذا تحقق الشرط'], ['if ... else', 'عبارة إذا تحقق الشرط، وعبارة أخرى إذا لم يتحقق'], ['if ... elif ... else', 'اختيار واحد من عدة خيارات']]
      },
      examples: [
        {
          ref: 'أمثلة على أنواع الجمل الشرطية – ص123 (if)',
          code: 'grade=17\nif grade>=10:\n    print("ناجح")',
          steps: [
            { line: 1, text: 'نضع الدرجة 17 في المتغير <b>grade</b>.', vars: { grade: '17' } },
            { line: 2, text: 'جملة <code>if</code> تفحص الشرط: هل grade أكبر من أو يساوي 10؟', vars: { grade: '17' }, eval: { expr: 'grade >= 10', sub: '17 >= 10', result: 'True' } },
            { line: 3, text: 'الشرط <b>True</b>، فتُنفَّذ العبارة التي تتبع <code>if</code> (المزاحة بمسافة بادئة).', vars: { grade: '17' }, out: 'ناجح' }
          ]
        },
        {
          ref: 'أمثلة على أنواع الجمل الشرطية – ص123 (if...else)',
          code: 'grade=7\nif grade>=10:\n    print("ناجح")\nelse:\n    print("تحتاج إلى المحاولة أكثر")',
          steps: [
            { line: 1, text: 'الدرجة هذه المرة 7.', vars: { grade: '7' } },
            { line: 2, text: 'هل 7 أكبر من أو يساوي 10؟', vars: { grade: '7' }, eval: { expr: 'grade >= 10', sub: '7 >= 10', result: 'False' } },
            { line: 4, text: 'الشرط <b>False</b>، فتتخطّى بايثون العبارة التي بعد <code>if</code> (السطر 3) وتنتقل إلى <code>else</code>.', vars: { grade: '7' }, skip: [3] },
            { line: 5, text: 'تُنفَّذ عبارة <code>else</code>.', vars: { grade: '7' }, out: 'تحتاج إلى المحاولة أكثر' }
          ]
        },
        {
          ref: 'أمثلة على أنواع الجمل الشرطية – ص123 (if...elif...else)',
          code: 'grade=12\nif grade>=15:\n    print("ممتاز")\nelif grade>=10:\n    print("جيد جدًا")\nelse:\n    print("تحتاج إلى المحاولة أكثر")',
          steps: [
            { line: 1, text: 'الدرجة 12.', vars: { grade: '12' } },
            { line: 2, text: 'الشرط الأول: هل 12 أكبر من أو يساوي 15؟', vars: { grade: '12' }, eval: { expr: 'grade >= 15', sub: '12 >= 15', result: 'False' } },
            { line: 4, text: 'لم يتحقق الشرط الأول، فتتخطّى بايثون السطر 3 وتفحص شرط <code>elif</code>.', vars: { grade: '12' }, eval: { expr: 'grade >= 10', sub: '12 >= 10', result: 'True' }, skip: [3] },
            { line: 5, text: 'تحقق شرط <code>elif</code>، فتُنفَّذ عبارته.', vars: { grade: '12' }, out: 'جيد جدًا' },
            { line: 5, text: 'بعد تنفيذ أحد الخيارات تنتهي الجملة الشرطية، فلا تُنفَّذ <code>else</code>. ستتعلمين <code>else</code> و <code>elif</code> بالتفصيل في الدرس القادم.', vars: { grade: '12' }, skip: [6, 7] }
          ]
        }
      ],
      lab: {
        files: { 'types.py': 'grade=12\nif grade>=15:\n    print("ممتاز")\nelif grade>=10:\n    print("جيد جدًا")\nelse:\n    print("تحتاج إلى المحاولة أكثر")\n' },
        challenges: [
          { text: 'غيّري قيمة <b>grade</b> فقط ليطبع البرنامج <b>ناجح</b>.', starter: 'grade=7\nif grade>=10:\n    print("ناجح")\n', expect: 'ناجح',
            mustUse: ['if\\s+grade\\s*>=\\s*10\\s*:'], need: 'أبقي الشرط كما هو وغيّري قيمة grade فقط.' },
          { text: 'في السطر 2 شيء ناقص. شغّلي البرنامج، واقرئي الخطأ، ثم صحّحيه.', starter: 'grade=17\nif grade>=10\n    print("ناجح")\n', expect: 'ناجح',
            mustUse: ['if\\s+grade\\s*>=\\s*10\\s*:'], need: 'لا تنسي النقطتين : بعد الشرط.' }
        ]
      },
      hint: 'ابحثي عن النقطتين : بعد كل شرط، والعبارات المزاحة تحته.'
    },

    /* ---------------------------------------------------------------- */
    {
      id: 'g2_simple_if',
      type: 'trace',
      title: 'جملة if البسيطة والمخطط الانسيابي',
      objectives: ['O2', 'O4', 'O5'],
      intro: '<b>جملة if الشرطية البسيطة</b> (ص124):<br>• إذا تحقق الشرط فستُنفَّذ العبارة أو العبارات التي تتبع <code>if</code>.<br>• إذا لم يتحقق الشرط فلن تُنفَّذ العبارة أو العبارات التي تتبع <code>if</code>.<br>تابعي المخطط الانسيابي: الشكل المضيء هو ما تنفّذه بايثون الآن.',
      examples: [
        {
          ref: 'مثال 1: مقارنة رقمين – ص125',
          code: 'a = 100\nb = 20\nif a > b:\n    print("a أكبر من b")\nprint ("استمر في البرمجة")',
          flow: FLOW_COMPARE,
          steps: [
            { line: 1, text: 'نضع 100 في <b>a</b>.', vars: { a: '100' }, node: 'p' },
            { line: 2, text: 'نضع 20 في <b>b</b>.', vars: { a: '100', b: '20' }, node: 'p' },
            { line: 3, text: '<b>الشرط</b>: هل a أكبر من b؟', vars: { a: '100', b: '20' }, eval: { expr: 'a > b', sub: '100 > 20', result: 'True' }, node: 'c' },
            { line: 4, text: 'الشرط <b>True</b> ← نسلك مسار <b>صواب</b> وتُنفَّذ <b>العبارة المعتمدة على تحقق الشرط</b> (المزاحة بمسافة بادئة).', vars: { a: '100', b: '20' }, out: 'a أكبر من b', node: 'y', path: 'yes' },
            { line: 5, text: 'هذا السطر بلا مسافة بادئة، فهو خارج جملة <code>if</code> ويُنفَّذ في كل الأحوال.', vars: { a: '100', b: '20' }, out: 'استمر في البرمجة', node: 'o' }
          ]
        },
        {
          ref: 'تطبيق على مثال 1: ماذا لو كانت a أصغر من b؟',
          code: 'a = 10\nb = 20\nif a > b:\n    print("a أكبر من b")\nprint ("استمر في البرمجة")',
          flow: Object.assign({}, FLOW_COMPARE, { pre: [{ id: 'p', text: 'a=10\nb=20', shape: 'proc' }] }),
          steps: [
            { line: 1, text: 'غيّرنا القيمة: a تساوي 10.', vars: { a: '10' }, node: 'p' },
            { line: 2, text: 'b تساوي 20.', vars: { a: '10', b: '20' }, node: 'p' },
            { line: 3, text: 'هل a أكبر من b؟', vars: { a: '10', b: '20' }, eval: { expr: 'a > b', sub: '10 > 20', result: 'False' }, node: 'c' },
            { line: 5, text: 'الشرط <b>False</b> ← نسلك مسار <b>خطأ</b>: تتخطّى بايثون السطر 4 وتنتقل مباشرة إلى أول سطر بعد جملة <code>if</code>.', vars: { a: '10', b: '20' }, out: 'استمر في البرمجة', skip: [4], node: 'o', path: 'no' }
          ]
        }
      ],
      lab: {
        files: { 'compare.py': 'a = 100\nb = 20\nif a > b:\n    print("a أكبر من b")\nprint ("استمر في البرمجة")\n' },
        challenges: [
          { text: 'غيّري قيمة واحدة فقط بحيث يطبع البرنامج <b>استمر في البرمجة</b> وحدها.', starter: 'a = 100\nb = 20\nif a > b:\n    print("a أكبر من b")\nprint("استمر في البرمجة")\n', expect: 'استمر في البرمجة',
            mustUse: ['if\\s+a\\s*>\\s*b\\s*:', 'print\\("a أكبر من b"\\)'], need: 'أبقي جملة if وأمر الطباعة كما هما، وغيّري قيمة a أو b.' },
          { text: 'أضيفي جملة <code>if</code> تطبع <b>b أكبر من a</b> عندما تكون b أكبر من a.', starter: 'a = 10\nb = 20\n', expect: 'b أكبر من a',
            mustUse: ['\\bif\\b', 'b\\s*>\\s*a|a\\s*<\\s*b'], need: 'استخدمي جملة if وشرطًا يقارن b و a.' }
        ]
      },
      hint: 'إذا كان الشرط True نسلك «صواب»، وإذا كان False نتخطّى العبارة المزاحة.'
    },

    /* ---------------------------------------------------------------- */
    {
      id: 'g3_indent',
      type: 'trace',
      title: 'المسافة البادئة',
      objectives: ['O3', 'O4'],
      intro: '<b>المسافة البادئة (Indentation)</b> في لغة البرمجة بايثون مهمة جدًا، إذ يستخدمها المقطع البرمجي للإشارة إلى العبارات المعتمدة على تحقيق الشرط. إذا لم تتركي مسافة بادئة، فستتلقين رسالة خطأ.<br>الصفوف غير المزوّدة بمسافة بادئة، والتي لا يعتمد تنفيذها على نتيجة الشرط، ستُنفَّذ حتى إذا لم يتحقق الشرط (ص124).<br>في باي تشارم: بعد النقطتين <code>:</code> اضغطي Enter فتُضاف المسافة البادئة تلقائيًا، أو استخدمي زر <b>⇥</b>.',
      examples: [
        {
          ref: 'بدون مسافة بادئة – ص124',
          code: 'grade=int(input("اكتب الدرجة"))\nif grade>=10:\nprint("ناجح")',
          steps: [
            { line: 2, text: 'قبل التشغيل تقرأ بايثون المقطع كاملًا. جملة <code>if</code> تنتهي بنقطتين <code>:</code>، فتتوقع أن يكون السطر التالي <b>مزاحًا</b> بمسافة بادئة.' },
            { line: 3, text: 'لكن السطر 3 يبدأ من أول السطر، فتتوقف بايثون قبل تنفيذ أي أمر، حتى قبل أن تطلب الدرجة، وتظهر رسالة الخطأ.', out: "IndentationError: expected an indented block after 'if' statement on line 2" }
          ]
        },
        {
          ref: 'العبارة غير المزاحة لا تنتمي إلى if – ص124',
          code: 'grade=18\nif grade>=15:\n    print("ممتاز")\nprint("استمر في تطوير مهاراتك")',
          steps: [
            { line: 1, text: 'الدرجة 18.', vars: { grade: '18' } },
            { line: 2, text: 'هل 18 أكبر من أو يساوي 15؟', vars: { grade: '18' }, eval: { expr: 'grade >= 15', sub: '18 >= 15', result: 'True' } },
            { line: 3, text: 'السطر 3 <b>مزاح</b>، فهو ينتمي إلى <code>if</code> ويُنفَّذ لأن الشرط True.', vars: { grade: '18' }, out: 'ممتاز' },
            { line: 4, text: 'أمر الطباعة الثاني <b>لا ينتمي</b> إلى جملة <code>if</code>، لذلك يُنفَّذ دون النظر إلى نتيجة الشرط.', vars: { grade: '18' }, out: 'استمر في تطوير مهاراتك' }
          ]
        },
        {
          ref: 'تطبيق: نفس المقطع والدرجة 12',
          code: 'grade=12\nif grade>=15:\n    print("ممتاز")\nprint("استمر في تطوير مهاراتك")',
          steps: [
            { line: 1, text: 'الدرجة هذه المرة 12.', vars: { grade: '12' } },
            { line: 2, text: 'هل 12 أكبر من أو يساوي 15؟', vars: { grade: '12' }, eval: { expr: 'grade >= 15', sub: '12 >= 15', result: 'False' } },
            { line: 4, text: 'الشرط False، فيُتخطّى السطر المزاح فقط. أما السطر 4 فيُنفَّذ دائمًا لأنه خارج <code>if</code>.', vars: { grade: '12' }, out: 'استمر في تطوير مهاراتك', skip: [3] }
          ]
        }
      ],
      lab: {
        files: { 'indent.py': 'grade=18\nif grade>=15:\n    print("ممتاز")\nprint("استمر في تطوير مهاراتك")\n' },
        challenges: [
          { text: 'صحّحي المسافة البادئة ليعمل البرنامج ويطبع <b>ناجح</b>.', starter: 'grade=12\nif grade>=10:\nprint("ناجح")\n', expect: 'ناجح',
            mustUse: ['\\n[ \\t]+print\\("ناجح"\\)'], need: 'أزيحي سطر الطباعة بمسافة بادئة تحت if.' },
          { text: 'عدّلي المسافات فقط بحيث يُطبع <b>انتهى البرنامج</b> دائمًا، و<b>ممتاز</b> فقط إذا تحقق الشرط.', starter: 'grade=12\nif grade>=15:\n    print("ممتاز")\n    print("انتهى البرنامج")\n', expect: 'انتهى البرنامج',
            mustUse: ['\\n[ \\t]+print\\("ممتاز"\\)', '\\nprint\\("انتهى البرنامج"\\)'], need: 'سطر «انتهى البرنامج» يجب أن يبدأ من أول السطر، و«ممتاز» يبقى مزاحًا.' }
        ]
      },
      hint: 'كل سطر مزاح تحت if يتبعها؛ والسطر الذي يبدأ من أول السطر خارجها.'
    },

    /* ---------------------------------------------------------------- */
    {
      id: 'g4_positive',
      type: 'trace',
      title: 'مثال 2: رقم موجب (مع مدخلات المستخدم)',
      objectives: ['O4', 'O5', 'O6'],
      intro: 'يقرأ المقطع البرمجي رقمًا من المستخدم ويتحقق مما إذا كان الرقم موجبًا (ص126).<br><code>input()</code> تنتظر المستخدمة لتكتب قيمة، و <code>int()</code> تحوّل ما كتبته إلى عدد صحيح لنقارنه.',
      examples: [
        {
          ref: 'مثال 2: رقم موجب – ص126 (المدخل 5)',
          code: 'print("من فضلك أدخل قيمة المتغير x:")\nx=int(input())\nif x>0:\n    print(x,"رقم موجب")\nprint ("استمر في البرمجة")',
          inputs: ['5'],
          flow: FLOW_POSITIVE,
          steps: [
            { line: 1, text: 'تطبع بايثون رسالة تطلب من المستخدمة إدخال قيمة.', out: 'من فضلك أدخل قيمة المتغير x:', node: 'p1' },
            { line: 2, text: 'تنتظر <code>input()</code> المستخدمة؛ كتبت <b>5</b> ثم Enter. تحوّلها <code>int()</code> إلى العدد 5 وتضعها في <b>x</b>.', vars: { x: '5' }, out: '5', node: 'p2' },
            { line: 3, text: 'الشرط: هل x أكبر من صفر؟', vars: { x: '5' }, eval: { expr: 'x > 0', sub: '5 > 0', result: 'True' }, node: 'c' },
            { line: 4, text: 'الشرط True ← تُطبع قيمة x ثم عبارة «رقم موجب».', vars: { x: '5' }, out: '5 رقم موجب', node: 'y', path: 'yes' },
            { line: 5, text: 'السطر الأخير خارج <code>if</code> فيُنفَّذ دائمًا.', vars: { x: '5' }, out: 'استمر في البرمجة', node: 'o' }
          ]
        },
        {
          ref: 'تطبيق على مثال 2: المدخل ‎-3',
          code: 'print("من فضلك أدخل قيمة المتغير x:")\nx=int(input())\nif x>0:\n    print(x,"رقم موجب")\nprint ("استمر في البرمجة")',
          inputs: ['-3'],
          flow: FLOW_POSITIVE,
          steps: [
            { line: 1, text: 'رسالة طلب الإدخال.', out: 'من فضلك أدخل قيمة المتغير x:', node: 'p1' },
            { line: 2, text: 'كتبت المستخدمة هذه المرة <b>-3</b>.', vars: { x: '-3' }, out: '-3', node: 'p2' },
            { line: 3, text: 'هل -3 أكبر من صفر؟', vars: { x: '-3' }, eval: { expr: 'x > 0', sub: '-3 > 0', result: 'False' }, node: 'c' },
            { line: 5, text: 'الشرط False ← يُتخطّى السطر 4، ويُنفَّذ السطر الأخير فقط.', vars: { x: '-3' }, out: 'استمر في البرمجة', skip: [4], node: 'o', path: 'no' }
          ]
        }
      ],
      tryIt: {
        ref: 'لنطبق معًا – ص127–128',
        snippets: [
          { ref: 'تدريب 2', code: 'a = -7\nif a < 0 :\n    a = a*(-1)\nprint(a)' },
          { ref: 'تدريب 3 (a=5, b=12, c=9)', code: 'print("من فضلك أدخل قيمة a و b و c:")\na=int(input())\nb=int(input())\nc=int(input())\nif a > b and a > c :\n    m = a\nif b > a and b > c :\n    m = b\nif c > a and c > b :\n    m =c\nprint(m)', inputs: ['5', '12', '9'] }
        ]
      },
      lab: {
        files: { 'positive.py': 'print("من فضلك أدخل قيمة المتغير x:")\nx=int(input())\nif x>0:\n    print(x,"رقم موجب")\nprint ("استمر في البرمجة")\n' },
        challenges: [
          { text: 'اكتبي برنامجًا يقرأ رقمًا ويطبع <b>رقم سالب</b> إذا كان أصغر من صفر (ولا يطبع شيئًا غير ذلك).', starter: 'x=int(input())\n',
            tests: [{ stdin: ['-4'], expect: 'رقم سالب' }, { stdin: ['6'], expect: '' }, { stdin: ['0'], expect: '' }],
            mustUse: ['\\bif\\b'], need: 'استخدمي جملة if.' },
          { text: 'تدريب 4 (ص128): اكتبي برنامجًا يقرأ العمر ويطبع <b>يمكنك القيادة</b> إذا كان 18 أو أكثر، ثم يطبع <b>شكرًا</b> في كل الحالات.', starter: 'age=int(input())\n',
            tests: [{ stdin: ['20'], expect: 'يمكنك القيادة\nشكرًا' }, { stdin: ['18'], expect: 'يمكنك القيادة\nشكرًا' }, { stdin: ['15'], expect: 'شكرًا' }],
            mustUse: ['\\bif\\b'], need: 'استخدمي جملة if.' }
        ]
      },
      hint: 'الرسالة تُطبع أولًا، ثم ننتظر المدخل، ثم نفحص الشرط.'
    }
  ],

  practice: {
    intro: 'أجيبي بمفردكِ. لن تظهر الإجابات أو الشروحات أثناء الحل. يمكنكِ تشغيل الكود في أسئلة البرمجة.',
    questions: [
      { id: 'l02_q01', type: 'multiple_choice', level: 'basic',
        prompt: 'ما الكلمة التي نستخدمها في بايثون لاتخاذ قرار بناءً على شرط؟',
        options: ['print', 'if', 'input', 'int'], optionsAreCode: true },

      { id: 'l02_q02', type: 'multiple_choice', level: 'basic',
        prompt: 'ما الرمز الذي يجب أن يأتي بعد الشرط في جملة <code>if</code>؟',
        options: [';', '=', ':', '.'], optionsAreCode: true },

      { id: 'l02_q03', type: 'predict_output', level: 'basic',
        prompt: 'ما ناتج تنفيذ المقطع البرمجي التالي؟',
        code: 'grade=14\nif grade>=10:\n    print("ناجح")' },

      { id: 'l02_q04', type: 'identify_operator', level: 'basic',
        prompt: 'أي معامل نضعه في الشرط لنتحقق أن x <b>لا يساوي</b> صفرًا؟ <code>if x ___ 0:</code>',
        options: ['=', '==', '!=', '<='], optionsAreCode: true },

      { id: 'l02_q05', type: 'predict_output', level: 'intermediate',
        prompt: 'ما ناتج تنفيذ المقطع البرمجي التالي؟',
        code: 'x=3\nif x>5:\n    print("كبير")\nprint("تم")' },

      { id: 'l02_q06', type: 'multiple_choice', level: 'intermediate',
        prompt: 'ماذا يحدث عند تشغيل المقطع البرمجي التالي؟',
        code: 'n=4\nif n<0:\n    print("سالب")\n    print("تم")',
        options: ['يطبع «سالب» ثم «تم»', 'يطبع «تم» فقط', 'لا يطبع شيئًا', 'تظهر رسالة IndentationError'] },

      { id: 'l02_q07', type: 'complete_line', level: 'intermediate',
        prompt: 'اكتبي معاملًا شرطيًا مكان الفراغ بحيث يطبع البرنامج <b>مسموح</b> عندما يكون العمر 18 أو أكثر.',
        code: 'age=18\nif age ___ 18:\n    print("مسموح")', blank: '___' },

      { id: 'l02_q08', type: 'find_error', level: 'intermediate',
        prompt: 'في أي سطر يوجد الخطأ الذي يمنع تشغيل البرنامج؟',
        code: 'x = 10\nif x > 5:\nprint("أكبر من 5")\nprint("انتهى")',
        options: ['السطر 1', 'السطر 2', 'السطر 3', 'السطر 4'] },

      { id: 'l02_q09', type: 'order_lines', level: 'intermediate',
        prompt: 'رتّبي الأسطر لتكوين برنامج يقرأ رقمًا ويطبع «رقم موجب» إذا كان أكبر من صفر (كما في المخطط الانسيابي ص126). اضغطي على الأسطر بالترتيب.',
        lines: ['    print(x,"رقم موجب")', 'x=int(input())', 'if x>0:'] },

      { id: 'l02_q10', type: 'predict_output', level: 'application',
        prompt: 'ما ناتج تنفيذ المقطع البرمجي التالي؟',
        code: 'a=-3\nb=2\nif a<b:\n    a=a+10\nprint(a)' },

      { id: 'l02_q11', type: 'write_program', level: 'application',
        prompt: 'اكتبي برنامجًا يقرأ درجة الطالبة (عددًا صحيحًا) باستخدام <code>int(input())</code>، ويطبع <b>ناجحة</b> إذا كانت الدرجة 50 أو أكثر، ثم يطبع <b>انتهى</b> في كل الحالات.<br>مثال: المدخل 75 ← يطبع <code>ناجحة</code> ثم <code>انتهى</code>. المدخل 30 ← يطبع <code>انتهى</code> فقط.',
        starter: 'grade = int(input())\n',
        tests: [{ stdin: ['75'] }, { stdin: ['50'] }, { stdin: ['30'] }] },

      { id: 'l02_q12', type: 'modify_condition', level: 'application',
        prompt: 'يجب أن يطبع البرنامج <b>درجة حرارة مرتفعة</b> عندما تكون درجة الحرارة <b>أكبر من 40</b>، لكنه لا يعمل بشكل صحيح. عدّلي <b>السطر 2 فقط</b>.',
        starter: 'temp=int(input())\nif temp < 40:\n    print("درجة حرارة مرتفعة")\nprint("تم القياس")\n',
        tests: [{ stdin: ['45'] }, { stdin: ['40'] }, { stdin: ['20'] }] }
    ]
  }
};
