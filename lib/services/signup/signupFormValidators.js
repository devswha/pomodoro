export const signupFormValidators = {
  passwordRequirements: [
    {
      label: '6자 이상',
      check: (password) => password.length >= 6
    },
    {
      label: '영문 포함',
      check: (password) => /[a-zA-Z]/.test(password)
    },
    {
      label: '숫자 포함',
      check: (password) => /[0-9]/.test(password)
    }
  ],

  isPasswordValid(password) {
    return this.passwordRequirements.every(req => req.check(password));
  }
};

