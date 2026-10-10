/* تهيئة الجدول الوهمي مرة واحدة: إنشاء الأوراق، كلمة مرور اختبارية، رمز دخول ثابت */
(function () {
  if (!__gas.db().sheets['الطالبات']) {
    setup();
    storeTeacherPassword_('test-pass-123');
    setSetting_('class_code', '4321');
    __gas.save();
  }
})();
