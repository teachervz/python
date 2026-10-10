/* =====================================================================
   مفاتيح الإجابات — تبقى على خادم جوجل فقط ولا تُرسل للطالبات قبل التسليم.
   كل درس: guidedCount (عدد الأنشطة الموجهة) + objectives + questions.
   أي تعديل في lessons/lesson_XX.js (نص السؤال أو ترتيب الخيارات) يجب أن يقابله تعديل هنا.
   ===================================================================== */

const ANSWER_KEYS = {
  lesson_01: {
    guidedCount: 5,
    objectives: {
      O1: 'إنشاء ملف بايثون وتشغيله في باي تشارم',
      O2: 'استخدام المعاملات الشرطية',
      O3: 'التمييز بين = و ==',
      O4: 'استخدام المعاملات المنطقية',
      O5: 'ترتيب المعاملات',
      O6: 'تصنيف المعاملات'
    },
    questions: {
      l01_q01: { type: 'multiple_choice', level: 'basic', objective: 'O2', points: 1,
        answer: { choice: 1 },
        explanation: 'المعامل != يعني «لا يساوي»، أما == فيعني «يساوي».' },

      l01_q02: { type: 'identify_operator', level: 'basic', objective: 'O6', points: 1,
        answer: { choice: 1 },
        explanation: '+= من معاملات الإسناد (مثل = و -= و *= و /=)، لأنه يُسند قيمة جديدة للمتغير.' },

      l01_q03: { type: 'predict_output', level: 'basic', objective: 'O2', points: 1,
        answer: { output: 'True' },
        explanation: '9 >= 4 صحيح، فتُخزَّن True في r ثم تُطبع.' },

      l01_q04: { type: 'multiple_choice', level: 'basic', objective: 'O3', points: 1,
        answer: { choice: 1 },
        explanation: 'a = 10 إسناد يضع القيمة في المتغير. أما a == 10 فهو سؤال مقارنة لا يغيّر a.' },

      l01_q05: { type: 'predict_output', level: 'intermediate', objective: 'O2', points: 1,
        answer: { output: 'False' },
        explanation: 'الطرح أولًا: 7 - 2 = 5، ثم 5 < 5 خطأ لأن 5 تساوي 5 وليست أصغر منها.' },

      l01_q06: { type: 'predict_output', level: 'intermediate', objective: 'O4', points: 1,
        answer: { output: 'False' },
        explanation: 'not b = not True = False، ثم False or False = False.' },

      l01_q07: { type: 'complete_line', level: 'intermediate', objective: 'O2', points: 1,
        answer: { accept: ['==', '>=', '<='] },
        explanation: '15 == 15 و 15 >= 15 و 15 <= 15 كلها True. أما > و < و != فناتجها False.' },

      l01_q08: { type: 'find_error', level: 'intermediate', objective: 'O3', points: 1,
        answer: { choice: 2 },
        explanation: 'السطر 3: المعامل الصحيح لـ «لا يساوي» هو != وليس =! ، فتظهر رسالة SyntaxError.' },

      l01_q09: { type: 'order_lines', level: 'intermediate', objective: 'O1', points: 1,
        // ترتيب فهارس الأسطر كما تظهر في السؤال: ['print(r)', 'a = 12', 'r = a > 10']
        answer: { order: [1, 2, 0] },
        explanation: 'نُسند القيمة أولًا a = 12، ثم نقارن r = a > 10، وأخيرًا نطبع print(r).' },

      l01_q10: { type: 'predict_output', level: 'application', objective: 'O5', points: 2,
        answer: { output: 'False' },
        explanation: 'p*2 = 6 و 6 > 8 خطأ. q-p = 5 و 5 == 5 صحيح، و not True = False. أخيرًا False or False = False.' },

      l01_q11: { type: 'write_program', level: 'application', objective: 'O2', points: 2,
        tests: [
          { stdin: ['7', '3'], expected: 'True\nFalse' },
          { stdin: ['4', '4'], expected: 'False\nTrue' },
          { stdin: ['2', '9'], expected: 'False\nFalse' }
        ],
        explanation: 'حل ممكن:\nnum1 = int(input())\nnum2 = int(input())\nprint(num1 > num2)\nprint(num1 == num2)' },

      l01_q12: { type: 'modify_condition', level: 'application', objective: 'O4', points: 2,
        starter: 'present = input() == "نعم"\nhomework = input() == "نعم"\nok = present or homework\nprint(ok)\n',
        onlyLine: 3,
        tests: [
          { stdin: ['نعم', 'نعم'], expected: 'True' },
          { stdin: ['نعم', 'لا'], expected: 'False' },
          { stdin: ['لا', 'نعم'], expected: 'False' },
          { stdin: ['لا', 'لا'], expected: 'False' }
        ],
        explanation: 'نحتاج الشرطين معًا، فنستبدل or بـ and:\nok = present and homework' }
    }
  }
};
