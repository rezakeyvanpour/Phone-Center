
// Login & Signup Page
document.addEventListener('DOMContentLoaded', function() {

  const loginForm = document.querySelector('.login form');
  const signupForm = document.querySelector('.signup form');
  const loginInputs = loginForm.querySelectorAll('input');
  const signupInputs = signupForm.querySelectorAll('input');
  const checkbox = document.getElementById('chk');

  function addFocusEffect(inputs) {
    inputs.forEach(input => {
      input.addEventListener('focus', function() {
        this.style.border = '2px solid #5427b0';
        this.style.boxShadow = '0 0 20px rgba(84, 39, 176, 0.25)';
        this.style.transition = 'all 0.3s ease';
        this.style.transform = 'scale(1.02)';
      });

      input.addEventListener('blur', function() {
        this.style.border = 'none';
        this.style.boxShadow = 'none';
        this.style.transform = 'scale(1)';
      });
    });
  }

  addFocusEffect(loginInputs);
  addFocusEffect(signupInputs);

//  Forms validation
  function validateForm(form, type) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      let isValid = true;
      const inputs = this.querySelectorAll('input');
      
      inputs.forEach(input => {
        input.style.border = '2px solid transparent';
        const existingError = input.parentNode.querySelector('.error-msg');
        if (existingError) existingError.remove();
      });

      inputs.forEach(input => {
        if (input.value.trim() === '') {
          isValid = false;
          input.style.border = '2px solid #ef4444';
          input.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.25)';
          
          const errorMsg = document.createElement('span');
          errorMsg.className = 'error-msg';
          errorMsg.textContent = 'این فیلد الزامی است';
          errorMsg.style.cssText = `
            color: #ef4444;
            font-size: 0.7rem;
            display: block;
            margin-top: 6px;
            text-align: right;
            animation: fadeIn 0.3s ease;
          `;
          input.parentNode.appendChild(errorMsg);
        }
      });

      if (!isValid) {
        this.style.animation = 'shake 0.5s ease';
        setTimeout(() => { this.style.animation = ''; }, 500);
        return;
      }
      const email = this.querySelector('input[name="email"]').value.trim();
      const password = this.querySelector('input[name="pswd"]').value;
      const endpoint = type === 'ورود' ? '/login' : '/register';
      const payload = type === 'ورود'
        ? { email, password }
        : {
            username: this.querySelector('input[name="txt"]').value.trim(),
            email,
            password
          };

      fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(res => res.json().then(body => ({ status: res.status, body })))
        .then(({ status, body }) => {
          if ((status === 200 || status === 201) && body.token) {
            localStorage.setItem('authToken', body.token);
            if (body.user) {
              localStorage.setItem('authUser', JSON.stringify(body.user));
            }
            showSuccessMessage(type);
            setTimeout(() => { window.location.href = '/'; }, 700);
          } else {
            alert(body.error || (type === 'ورود' ? 'نام کاربری یا رمز اشتباه است' : 'ثبت نام انجام نشد'));
          }
        })
        .catch(err => {
          console.error(err);
          alert('خطا در ارتباط با سرور');
        });
        return;
    });
  }

  validateForm(loginForm, 'ورود');
  validateForm(signupForm, 'ثبت نام');

  // Show success message
  function showSuccessMessage(type) {
    const oldMsg = document.querySelector('.success-msg');
    if (oldMsg) oldMsg.remove();

    const msg = document.createElement('div');
    msg.className = 'success-msg';
    msg.textContent = `✅ ${type} با موفقیت انجام شد!`;
    msg.style.cssText = `
      position: fixed;
      top: 30px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: #22c55e;
      color: white;
      padding: 12px 30px;
      border-radius: 10px;
      font-weight: 600;
      box-shadow: 0 10px 30px rgba(34, 197, 94, 0.3);
      z-index: 999;
      opacity: 0;
      transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      font-size: 0.95rem;
      direction: rtl;
    `;
    document.body.appendChild(msg);

    setTimeout(() => {
      msg.style.opacity = '1';
      msg.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    setTimeout(() => {
      msg.style.opacity = '0';
      msg.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => msg.remove(), 500);
    }, 3000);
  }
  // ۵. Input animation when page loads

  function entranceAnimation() {
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach((input, index) => {
      input.style.opacity = '0';
      input.style.transform = 'translateY(20px)';
      input.style.transition = `all 0.4s ease ${index * 0.08}s`;
      setTimeout(() => {
        input.style.opacity = '1';
        input.style.transform = 'translateY(0)';
      }, 100);
    });

    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, index) => {
      btn.style.opacity = '0';
      btn.style.transform = 'scale(0.9)';
      btn.style.transition = `all 0.4s ease ${index * 0.08 + 0.3}s`;
      setTimeout(() => {
        btn.style.opacity = '1';
        btn.style.transform = 'scale(1)';
      }, 300);
    });

    const labels = document.querySelectorAll('label');
    labels.forEach((label, index) => {
      label.style.opacity = '0';
      label.style.transform = 'translateY(-10px)';
      label.style.transition = `all 0.5s ease ${index * 0.1 + 0.1}s`;
      setTimeout(() => {
        label.style.opacity = '1';
        label.style.transform = 'translateY(0)';
      }, 200);
    });
  }
  entranceAnimation();

  // ۶. Change background when switching between login and registration
  if (checkbox) {
    checkbox.addEventListener('change', function() {
      const main = document.querySelector('.main');
      if (this.checked) {
        main.style.background = 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)';
      } else {
        main.style.background = 'url("https://doc-08-2c-docs.googleusercontent.com/docs/securesc/68c90smiglihng9534mvqmq1946dmis5/fo0picsp1nhiucmc0l25s29respgpr4j/1631524275000/03522360960922298374/03522360960922298374/1Sx0jhdpEpnNIydS4rnN4kHSJtU1EyWka?e=view&authuser=0&nonce=gcrocepgbb17m&user=03522360960922298374&hash=tfhgbs86ka6divo3llbvp93mg4csvb38") no-repeat center/cover';
      }
    });
  }

  // Adding animation styles dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-8px); }
      40% { transform: translateX(8px); }
      60% { transform: translateX(-5px); }
      80% { transform: translateX(5px); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .main {
      transition: all 0.8s ease !important;
    }
    input, button {
      transition: all 0.3s ease !important;
    }
  `;
  document.head.appendChild(style);
  console.log('✅ صفحه ورود/ثبت نام با موفقیت راه‌اندازی شد!');
});

