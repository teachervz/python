/* =====================================================================
   الدرس الأول: المعاملات الشرطية والمعاملات المنطقية في بايثون
   المصدر: كتاب المهارات الرقمية – الصف الثاني المتوسط – الوحدة الثالثة (ص112–121)

   هذا الملف محتوى عام يُرسل للمتصفح: لا يحتوي على أي إجابات للتدريب المستقل.
   مفاتيح الإجابات موجودة فقط في apps-script/AnswerKeys.gs على خادم جوجل.

   شكل خطوة التتبّع:
     { line, text, vars?, eval?: {expr, sub, result}, out?, hint? }
     line   رقم السطر المظلّل (يبدأ من 1)
     vars   قيم المتغيرات بعد هذه الخطوة
     eval   التعبير الذي يُقيَّم الآن، وبعد التعويض بالقيم، والناتج
     out    نص يُضاف إلى نافذة التشغيل
   ===================================================================== */

export default {
  id: 'lesson_01',
  number: 1,
  version: 1,
  title: 'المعاملات الشرطية والمنطقية في بايثون – اتخاذ القرارات',
  bookTitle: 'المعاملات الشرطية والمعاملات المنطقية في بايثون',
  bookPages: '112–121',
  estimatedMinutes: 45,
  summary: 'نقارن القيم ونربط الشروط لنحصل على True أو False',
  objectives: [
    { id: 'O1', text: 'أنشئ ملف بايثون في بيئة باي تشارم وأشغّله وأقرأ الناتج في نافذة التشغيل' },
    { id: 'O2', text: 'أستخدم المعاملات الشرطية وأعرف أن ناتجها True أو False' },
    { id: 'O3', text: 'أميّز بين معامل الإسناد = ومعامل المساواة ==' },
    { id: 'O4', text: 'أستخدم المعاملات المنطقية and و or و not وأقرأ جدول الحقيقة' },
    { id: 'O5', text: 'أطبّق ترتيب المعاملات لأتوقع ناتج تعبير مركّب' },
    { id: 'O6', text: 'أصنّف المعاملات في فئاتها الأربع' }
  ],

  /* ------------------------------------------------------------------ */
  guided: [
    {
      id: 'g1_pycharm',
      type: 'pycharm_task',
      title: 'أنشئي ملفكِ الأول وشغّليه',
      objectives: ['O1'],
      intro: 'بيئة التواصل باي تشارم بيئة تطوير متكاملة (IDE) تُستخدم خصيصًا لبايثون: نكتب فيها المقطع البرمجي ونشغّله ونكتشف أخطاءه. نفّذي الخطوات كما في الكتاب (ص112–115).',
      steps: [
        'افتحي باي تشارم: اضغطي <b>Search</b> (بحث) 🔍 واكتبي <b>PyCharm</b> ثم اضغطي عليه',
        'أنشئي المشروع: اضغطي <b>Create</b>',
        'اضغطي <b>File</b> (ملف) ثم <b>New</b> (جديد)',
        'حدّدي <b>Python File</b> (ملف بايثون) 🐍',
        'اكتبي اسمًا لملفكِ (مثل <b>hello</b>) واضغطي <b>Enter</b>',
        'اكتبي أمر بايثون بسيطًا:<br><code>print("Hello world")</code>',
        'اضغطي بزر الفأرة الأيمن على ملفكِ (أو اضغطي مطوّلًا على الآيباد) ← <b>Run</b> (تشغيل)'
      ],
      tries: [
        { code: 'print("Hello world")\nprint("مرحبًا بالعالم")', note: 'مثال الكتاب ص114' },
        { code: 'x=5\ny=6\nprint(x<y)', note: 'معامل شرطي' },
        { code: 'print(Hello)', note: 'خطأ مقصود: اكتشفيه!' }
      ],
      hint: 'انظري إلى العنصر المضيء باللون البرتقالي: هو الخطوة التالية.'
    },

    {
      id: 'g2_compare',
      type: 'trace',
      title: 'المعاملات الشرطية خطوة بخطوة',
      objectives: ['O2'],
      intro: 'لاتخاذ قرار في البرمجة نستخدم المعاملات الشرطية. تقارن قيمتين وتعود بنتيجة <b>صواب (True)</b> أو <b>خطأ (False)</b>، وستجدينها عادةً جزءًا من <code>if</code> أو <code>while</code>.',
      table: {
        head: ['المعامل', 'المعنى'],
        rows: [['==', 'يساوي'], ['>', 'أكبر من'], ['<', 'أصغر من'], ['>=', 'أكبر من أو يساوي'], ['<=', 'أصغر من أو يساوي'], ['!=', 'لا يساوي']]
      },
      examples: [
        {
          ref: 'مثال 1 – ص116',
          code: 'x=5\ny=6\nz=x==y\nprint(z)',
          steps: [
            { line: 1, text: 'نضع القيمة 5 في المتغير <b>x</b> باستخدام معامل الإسناد <code>=</code>.', vars: { x: '5' } },
            { line: 2, text: 'نضع القيمة 6 في المتغير <b>y</b>.', vars: { x: '5', y: '6' } },
            { line: 3, text: 'تبدأ بايثون بالطرف الأيمن وتسأل: هل <b>x</b> يساوي <b>y</b>؟', vars: { x: '5', y: '6' }, eval: { expr: 'x == y', sub: '5 == 6', result: 'False' } },
            { line: 3, text: 'ناتج المقارنة <b>False</b> يُخزَّن في المتغير <b>z</b>.', vars: { x: '5', y: '6', z: 'False' } },
            { line: 4, text: 'الأمر <code>print</code> يعرض قيمة <b>z</b> في نافذة التشغيل.', vars: { x: '5', y: '6', z: 'False' }, out: 'False' }
          ]
        },
        {
          ref: 'مثال 1 – ص116',
          code: 'x=5\ny=6\nk=x<y\nprint(k)',
          steps: [
            { line: 1, text: 'x تساوي 5.', vars: { x: '5' } },
            { line: 2, text: 'y تساوي 6.', vars: { x: '5', y: '6' } },
            { line: 3, text: 'هل <b>x</b> أصغر من <b>y</b>؟', vars: { x: '5', y: '6' }, eval: { expr: 'x < y', sub: '5 < 6', result: 'True' } },
            { line: 3, text: 'الناتج <b>True</b> يُخزَّن في <b>k</b>.', vars: { x: '5', y: '6', k: 'True' } },
            { line: 4, text: 'نعرض قيمة <b>k</b>.', vars: { x: '5', y: '6', k: 'True' }, out: 'True' }
          ]
        },
        {
          ref: 'مثال 1 – ص116',
          code: 'x=5\ny=6\nn=x+y!=15\nprint(n)',
          steps: [
            { line: 1, text: 'x تساوي 5.', vars: { x: '5' } },
            { line: 2, text: 'y تساوي 6.', vars: { x: '5', y: '6' } },
            { line: 3, text: 'المعاملات الرياضية تُنفَّذ <b>قبل</b> المقارنة، فنحسب <b>x + y</b> أولًا.', vars: { x: '5', y: '6' }, eval: { expr: 'x + y', sub: '5 + 6', result: '11' } },
            { line: 3, text: 'الآن نسأل: هل 11 <b>لا يساوي</b> 15؟', vars: { x: '5', y: '6' }, eval: { expr: '11 != 15', sub: '11 != 15', result: 'True' } },
            { line: 3, text: 'الناتج <b>True</b> يُخزَّن في <b>n</b>.', vars: { x: '5', y: '6', n: 'True' } },
            { line: 4, text: 'نعرض قيمة <b>n</b>.', vars: { x: '5', y: '6', n: 'True' }, out: 'True' }
          ]
        },
        {
          ref: 'مثال 1 – ص116',
          code: 'x=5\ny=5\nm=x-y<=0\nprint(m)',
          steps: [
            { line: 1, text: 'x تساوي 5.', vars: { x: '5' } },
            { line: 2, text: 'y تساوي 5 أيضًا.', vars: { x: '5', y: '5' } },
            { line: 3, text: 'نحسب الطرح أولًا: <b>x - y</b>.', vars: { x: '5', y: '5' }, eval: { expr: 'x - y', sub: '5 - 5', result: '0' } },
            { line: 3, text: 'هل 0 <b>أصغر من أو يساوي</b> 0؟ نعم، لأنهما متساويان.', vars: { x: '5', y: '5' }, eval: { expr: '0 <= 0', sub: '0 <= 0', result: 'True' } },
            { line: 3, text: 'الناتج <b>True</b> يُخزَّن في <b>m</b>.', vars: { x: '5', y: '5', m: 'True' } },
            { line: 4, text: 'نعرض قيمة <b>m</b>.', vars: { x: '5', y: '5', m: 'True' }, out: 'True' }
          ]
        }
      ],
      tryIt: {
        ref: 'جرب بنفسك – ص117',
        snippets: ['a=5>7\nprint(a)', 'b=8<=8\nprint(b)', 'c=5+9>=14\nprint(c)']
      },
      hint: 'تذكّري: الحساب أولًا (+ و -)، ثم المقارنة، والناتج دائمًا True أو False.'
    },

    {
      id: 'g3_assign_vs_eq',
      type: 'trace',
      title: 'الإسناد = أم المساواة ==؟',
      objectives: ['O3'],
      intro: '<b>معلومة من الكتاب (ص116):</b> من الأخطاء الشائعة الخلط بين معامل الإسناد <code>=</code> ومعامل المساواة <code>==</code>. معامل الإسناد <b>يغيّر</b> قيمة المتغير، أما معامل المساواة <b>فيقرأ</b> قيمة المتغير ويرى هل تساوي شيئًا ما.',
      examples: [
        {
          ref: 'تطبيق على معلومة ص116',
          code: 'x = 5\nprint(x == 5)\nx = 7\nprint(x == 5)',
          steps: [
            { line: 1, text: '<code>=</code> إسناد: نضع 5 داخل <b>x</b>.', vars: { x: '5' } },
            { line: 2, text: '<code>==</code> مقارنة: لا تغيّر <b>x</b>، بل تسأل فقط: هل x يساوي 5؟', vars: { x: '5' }, eval: { expr: 'x == 5', sub: '5 == 5', result: 'True' } },
            { line: 2, text: 'نعرض الناتج.', vars: { x: '5' }, out: 'True' },
            { line: 3, text: '<code>=</code> مرة أخرى: القيمة القديمة تُستبدل، وتصبح <b>x</b> تساوي 7.', vars: { x: '7' } },
            { line: 4, text: 'نسأل السؤال نفسه: هل x يساوي 5؟', vars: { x: '7' }, eval: { expr: 'x == 5', sub: '7 == 5', result: 'False' } },
            { line: 4, text: 'نعرض الناتج. لاحظي أن <code>==</code> لم تغيّر قيمة x أبدًا.', vars: { x: '7' }, out: 'False' }
          ]
        }
      ],
      hint: 'اقرئي = «ضعي في»، واقرئي == «هل يساوي؟».'
    },

    {
      id: 'g4_logic',
      type: 'trace',
      title: 'المعاملات المنطقية وجدول الحقيقة',
      objectives: ['O4'],
      intro: 'قد نحتاج إلى دمج شرطين أو أكثر، وهنا نستخدم المعاملات المنطقية (ص117):<br><code>and</code> تعود بـ True إذا كانت <b>كلتا</b> العبارتين صحيحة.<br><code>or</code> تعود بـ True إذا كانت <b>إحدى</b> العبارات صحيحة.<br><code>not</code> تعود بالقيمة <b>العكسية</b>.',
      truthTable: true,
      examples: [
        {
          ref: 'مثال 2 – ص118',
          code: 'x=5\ny=6\nk=x<10 and y<8\nprint(k)',
          steps: [
            { line: 1, text: 'x تساوي 5.', vars: { x: '5' } },
            { line: 2, text: 'y تساوي 6.', vars: { x: '5', y: '6' } },
            { line: 3, text: 'الشرط الأول: هل x أصغر من 10؟', vars: { x: '5', y: '6' }, eval: { expr: 'x < 10', sub: '5 < 10', result: 'True' } },
            { line: 3, text: 'الشرط الثاني: هل y أصغر من 8؟', vars: { x: '5', y: '6' }, eval: { expr: 'y < 8', sub: '6 < 8', result: 'True' } },
            { line: 3, text: '<code>and</code> تحتاج أن يكون الشرطان True، وهما كذلك.', vars: { x: '5', y: '6' }, eval: { expr: 'True and True', sub: 'True and True', result: 'True' } },
            { line: 4, text: 'نعرض قيمة <b>k</b>.', vars: { x: '5', y: '6', k: 'True' }, out: 'True' }
          ]
        },
        {
          ref: 'مثال 2 – ص118',
          code: 'x=True\ny=False\nz=x==y\nprint(z)',
          steps: [
            { line: 1, text: 'يمكن أن يحمل المتغير قيمة منطقية: x تساوي True.', vars: { x: 'True' } },
            { line: 2, text: 'y تساوي False.', vars: { x: 'True', y: 'False' } },
            { line: 3, text: 'هل True يساوي False؟', vars: { x: 'True', y: 'False' }, eval: { expr: 'x == y', sub: 'True == False', result: 'False' } },
            { line: 4, text: 'نعرض قيمة <b>z</b>.', vars: { x: 'True', y: 'False', z: 'False' }, out: 'False' }
          ]
        },
        {
          ref: 'مثال 2 – ص118',
          code: 'x=True\ny=False\nm=(x or y) and (not False)\nprint(m)',
          steps: [
            { line: 1, text: 'x تساوي True.', vars: { x: 'True' } },
            { line: 2, text: 'y تساوي False.', vars: { x: 'True', y: 'False' } },
            { line: 3, text: 'نبدأ بما داخل الأقواس الأولى: <code>or</code> يكفيها شرط واحد صحيح.', vars: { x: 'True', y: 'False' }, eval: { expr: 'x or y', sub: 'True or False', result: 'True' } },
            { line: 3, text: 'ثم الأقواس الثانية: <code>not</code> تعكس القيمة.', vars: { x: 'True', y: 'False' }, eval: { expr: 'not False', sub: 'not False', result: 'True' } },
            { line: 3, text: 'وأخيرًا <code>and</code> بين الناتجين.', vars: { x: 'True', y: 'False' }, eval: { expr: 'True and True', sub: 'True and True', result: 'True' } },
            { line: 4, text: 'نعرض قيمة <b>m</b>.', vars: { x: 'True', y: 'False', m: 'True' }, out: 'True' }
          ]
        },
        {
          ref: 'مثال 2 – ص118',
          code: 'x=5\ny=6\nn=x>y and (not y==6)\nprint(n)',
          steps: [
            { line: 1, text: 'x تساوي 5.', vars: { x: '5' } },
            { line: 2, text: 'y تساوي 6.', vars: { x: '5', y: '6' } },
            { line: 3, text: 'الشرط الأول: هل x أكبر من y؟', vars: { x: '5', y: '6' }, eval: { expr: 'x > y', sub: '5 > 6', result: 'False' } },
            { line: 3, text: 'الشرط الثاني داخل الأقواس: y == 6 ناتجه True، و <code>not</code> تعكسه.', vars: { x: '5', y: '6' }, eval: { expr: 'not y == 6', sub: 'not True', result: 'False' } },
            { line: 3, text: '<code>and</code> تحتاج الشرطين معًا، والأول False، فالناتج False.', vars: { x: '5', y: '6' }, eval: { expr: 'False and False', sub: 'False and False', result: 'False' } },
            { line: 4, text: 'نعرض قيمة <b>n</b>.', vars: { x: '5', y: '6', n: 'False' }, out: 'False' }
          ]
        }
      ],
      tryIt: {
        ref: 'جرب بنفسك – ص118',
        snippets: ['a=True\nb=False\nc=False\nz=(a or b) and (not c)\nprint(z)', 'a=True\nb=True\nc=True\nz=(a or b) and (not c)\nprint(z)']
      },
      hint: 'استخدمي جدول الحقيقة: and مثل «و» تحتاج الاثنين، و or مثل «أو» يكفيها واحد.'
    },

    {
      id: 'g5_precedence',
      type: 'trace',
      title: 'ترتيب المعاملات في البرمجة',
      objectives: ['O5'],
      intro: 'عندما يحتوي السطر على أكثر من معامل، تنفّذها بايثون بهذا الترتيب (ص117):<br><code>()</code> ← <code>**</code> ← <code>* /</code> ← <code>+ -</code> ← <code>== != > < >= <=</code> ← <code>not</code> ← <code>and</code> ← <code>or</code>',
      examples: [
        {
          ref: 'تطبيق على ترتيب المعاملات – ص117',
          code: 'x=4\ny=3\nz=x*2>=y+5 and not x==3\nprint(z)',
          steps: [
            { line: 1, text: 'x تساوي 4.', vars: { x: '4' } },
            { line: 2, text: 'y تساوي 3.', vars: { x: '4', y: '3' } },
            { line: 3, text: 'لا توجد أقواس ولا أُس، فنبدأ بالضرب <code>*</code>.', vars: { x: '4', y: '3' }, eval: { expr: 'x * 2', sub: '4 * 2', result: '8' } },
            { line: 3, text: 'ثم الجمع <code>+</code>.', vars: { x: '4', y: '3' }, eval: { expr: 'y + 5', sub: '3 + 5', result: '8' } },
            { line: 3, text: 'ثم المقارنات: أولًا <code>&gt;=</code>.', vars: { x: '4', y: '3' }, eval: { expr: '8 >= 8', sub: '8 >= 8', result: 'True' } },
            { line: 3, text: 'والمقارنة الثانية <code>==</code>.', vars: { x: '4', y: '3' }, eval: { expr: 'x == 3', sub: '4 == 3', result: 'False' } },
            { line: 3, text: 'بعد المقارنات يأتي <code>not</code>.', vars: { x: '4', y: '3' }, eval: { expr: 'not False', sub: 'not False', result: 'True' } },
            { line: 3, text: 'وأخيرًا <code>and</code>.', vars: { x: '4', y: '3' }, eval: { expr: 'True and True', sub: 'True and True', result: 'True' } },
            { line: 4, text: 'نعرض قيمة <b>z</b>.', vars: { x: '4', y: '3', z: 'True' }, out: 'True' }
          ]
        }
      ],
      hint: 'ابدئي دائمًا من الحساب، ثم المقارنة، ثم not ثم and ثم or.'
    }
  ],

  /* ------------------------------------------------------------------
     التدريب المستقل — نصوص الأسئلة فقط. لا إجابات ولا شروحات هنا.
     type: multiple_choice | identify_operator | predict_output | complete_line |
           find_error | order_lines | write_program | modify_condition
     ------------------------------------------------------------------ */
  practice: {
    intro: 'أجيبي بمفردكِ. لن تظهر الإجابات أو الشروحات أثناء الحل. يمكنكِ تشغيل الكود في أسئلة البرمجة.',
    questions: [
      { id: 'l01_q01', type: 'multiple_choice', level: 'basic',
        prompt: 'أي معامل يعني «لا يساوي»؟',
        options: ['==', '!=', '<=', '='], optionsAreCode: true },

      { id: 'l01_q02', type: 'identify_operator', level: 'basic',
        prompt: 'إلى أي فئة من فئات المعاملات ينتمي المعامل <code>+=</code>؟',
        options: ['المعاملات الرياضية', 'معاملات الإسناد', 'المعاملات الشرطية', 'المعاملات المنطقية'] },

      { id: 'l01_q03', type: 'predict_output', level: 'basic',
        prompt: 'ما ناتج تنفيذ المقطع البرمجي التالي؟',
        code: 'x=9\ny=4\nr=x>=y\nprint(r)' },

      { id: 'l01_q04', type: 'multiple_choice', level: 'basic',
        prompt: 'أي سطر يضع القيمة 10 في المتغير a؟',
        options: ['a == 10', 'a = 10', 'a != 10', '10 == a'], optionsAreCode: true },

      { id: 'l01_q05', type: 'predict_output', level: 'intermediate',
        prompt: 'ما ناتج تنفيذ المقطع البرمجي التالي؟',
        code: 'x=7\ny=2\nt=x-y<5\nprint(t)' },

      { id: 'l01_q06', type: 'predict_output', level: 'intermediate',
        prompt: 'ما ناتج تنفيذ المقطع البرمجي التالي؟',
        code: 'a=False\nb=True\nc=a or not b\nprint(c)' },

      { id: 'l01_q07', type: 'complete_line', level: 'intermediate',
        prompt: 'اكتبي معاملًا شرطيًا واحدًا مكان الفراغ بحيث يطبع البرنامج <b>True</b>.',
        code: 'n=15\nprint(n ___ 15)', blank: '___' },

      { id: 'l01_q08', type: 'find_error', level: 'intermediate',
        prompt: 'في أي سطر يوجد الخطأ الذي يمنع تشغيل البرنامج؟',
        code: 'x = 6\ny = 9\nz = x =! y\nprint(z)',
        options: ['السطر 1', 'السطر 2', 'السطر 3', 'السطر 4'] },

      { id: 'l01_q09', type: 'order_lines', level: 'intermediate',
        prompt: 'رتّبي الأسطر لتكوين برنامج صحيح يطبع <b>True</b>. اضغطي على الأسطر بالترتيب.',
        lines: ['print(r)', 'a = 12', 'r = a > 10'] },

      { id: 'l01_q10', type: 'predict_output', level: 'application',
        prompt: 'ما ناتج تنفيذ المقطع البرمجي التالي؟',
        code: 'p=3\nq=8\nr=p*2>q or not q-p==5\nprint(r)' },

      { id: 'l01_q11', type: 'write_program', level: 'application',
        prompt: 'اكتبي برنامجًا يقرأ عددين صحيحين من المستخدمة (باستخدام <code>int(input())</code>)، ثم يطبع في السطر الأول: هل العدد الأول <b>أكبر من</b> الثاني؟ وفي السطر الثاني: هل العددان <b>متساويان</b>؟<br>مثال: إذا أُدخل 7 ثم 3 يطبع البرنامج:<br><code>True</code><br><code>False</code>',
        starter: 'num1 = int(input())\nnum2 = int(input())\n',
        tests: [{ stdin: ['7', '3'] }, { stdin: ['4', '4'] }, { stdin: ['2', '9'] }] },

      { id: 'l01_q12', type: 'modify_condition', level: 'application',
        prompt: 'عدّلي السطر 3 فقط بحيث يطبع البرنامج <b>True</b> فقط عندما تكون الطالبة حاضرة <b>و</b> أنهت الواجب، و <b>False</b> في غير ذلك. تُدخل الإجابة بكلمة «نعم» أو «لا».',
        starter: 'present = input() == "نعم"\nhomework = input() == "نعم"\nok = present or homework\nprint(ok)\n',
        tests: [{ stdin: ['نعم', 'نعم'] }, { stdin: ['نعم', 'لا'] }, { stdin: ['لا', 'نعم'] }, { stdin: ['لا', 'لا'] }] }
    ]
  }
};
