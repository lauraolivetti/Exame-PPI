const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: "petshop",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30 * 60 * 1000 } // 30 minutos
  })
);

//DADOS EM MEMÓRIA 
let interessados = [];
let pets = [];
let adocoes = [];

// LOGIN
app.get("/", (req, res) => {
  res.send(`
    <h1>Login</h1>
    <form method="POST" action="/login">
      Usuário: <input name="usuario" required><br>
      Senha: <input type="password" name="senha" required><br>
      <button>Entrar</button>
    </form>
  `);
});

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario === "admin" && senha === "123") {
    req.session.logado = true;
    res.cookie("ultimoAcesso", new Date().toLocaleString("pt-BR"));
    return res.redirect("/menu");
  }

  res.send("Login inválido <br><a href='/'>Voltar</a>");
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// MIDDLEWARE 
function auth(req, res, next) {
  if (req.session.logado) return next();
  res.redirect("/");
}

// MENU 
app.get("/menu", auth, (req, res) => {
  res.send(`
    <h1>Menu</h1>
    <p>Último acesso: ${req.cookies.ultimoAcesso || "Primeiro acesso"}</p>

    <a href="/cadastro-interessado">Cadastrar Interessado</a><br>
    <a href="/cadastro-pet">Cadastrar Pet</a><br>
    <a href="/adotar">Adotar um Pet</a><br>
    <a href="/logout">Sair</a>
  `);
});

// INTERESSADOS 
app.get("/cadastro-interessado", auth, (req, res) => {
  res.send(`
    <h1>Cadastrar Interessado</h1>
    <form method="POST">
      Nome: <input name="nome" required><br>
      Email: <input name="email" required><br>
      Telefone: <input name="telefone" required><br>
      <button>Cadastrar</button>
    </form>
    <a href="/menu">Menu</a>
  `);
});

app.post("/cadastro-interessado", auth, (req, res) => {
  const { nome, email, telefone } = req.body;

  if (!nome || !email || !telefone) {
    return res.send("Todos os campos são obrigatórios!");
  }

  interessados.push({ nome, email, telefone });
  res.redirect("/lista-interessados");
});

app.get("/lista-interessados", auth, (req, res) => {
  let html = "<h1>Interessados</h1>";

  interessados.forEach((i, idx) => {
    html += `<p>${idx + 1} - ${i.nome} (${i.email})</p>`;
  });

  html += `<a href="/cadastro-interessado">Novo</a><br><a href="/menu">Menu</a>`;
  res.send(html);
});

// PETS 
app.get("/cadastro-pet", auth, (req, res) => {
  res.send(`
    <h1>Cadastrar Pet</h1>
    <form method="POST">
      Nome: <input name="nome" required><br>
      Raça: <input name="raca" required><br>
      Idade (anos): <input name="idade" required><br>
      <button>Cadastrar</button>
    </form>
    <a href="/menu">Menu</a>
  `);
});

app.post("/cadastro-pet", auth, (req, res) => {
  const { nome, raca, idade } = req.body;

  if (!nome || !raca || !idade) {
    return res.send("Todos os campos são obrigatórios!");
  }

  pets.push({ nome, raca, idade });
  res.redirect("/lista-pets");
});

app.get("/lista-pets", auth, (req, res) => {
  let html = "<h1>Pets</h1>";

  pets.forEach((p, idx) => {
    html += `<p>${idx + 1} - ${p.nome} (${p.raca}) - ${p.idade} anos</p>`;
  });

  html += `<a href="/cadastro-pet">Novo</a><br><a href="/menu">Menu</a>`;
  res.send(html);
});

// ADOÇÃO
app.get("/adotar", auth, (req, res) => {
  if (interessados.length === 0 || pets.length === 0) {
    return res.send("Cadastre interessados e pets antes!<br><a href='/menu'>Menu</a>");
  }

  let interessadosOptions = interessados
    .map(i => `<option value="${i.nome}">${i.nome}</option>`)
    .join("");

  let petsOptions = pets
    .map(p => `<option value="${p.nome}">${p.nome}</option>`)
    .join("");

  res.send(`
    <h1>Desejo de Adoção</h1>
    <form method="POST">
      Interessado:
      <select name="interessado" required>
        ${interessadosOptions}
      </select><br>

      Pet:
      <select name="pet" required>
        ${petsOptions}
      </select><br>

      <button>Registrar</button>
    </form>
    <a href="/menu">Menu</a>
  `);
});

app.post("/adotar", auth, (req, res) => {
  const { interessado, pet } = req.body;

  if (!interessado || !pet) {
    return res.send("Selecione interessado e pet!");
  }

  adocoes.push({
    interessado,
    pet,
    data: new Date().toLocaleString("pt-BR")
  });

  let html = "<h1>Desejos de Adoção</h1>";
  adocoes.forEach(a => {
    html += `<p>${a.interessado} deseja adotar ${a.pet} em ${a.data}</p>`;
  });

  html += `<a href="/adotar">Novo</a><br><a href="/menu">Menu</a>`;
  res.send(html);
});


module.exports = app;

// LOCALHOST
if (require.main === module) {
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}
