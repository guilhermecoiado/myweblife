const bcrypt = require('bcryptjs');

const senha = 'Padrao@123'; // Troque pela senha desejada
bcrypt.hash(senha, 10).then(hash => {
  console.log('Hash:', hash);
});