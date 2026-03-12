<?php
class Usuario {
    private $pdo;

    public function __construct($pdo){
        $this->pdo = $pdo;
    }

    public function login($email, $password){
        $stmt = $this->pdo->prepare("SELECT * FROM usuarios WHERE email = ?"); 
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) return false;

        if (password_verify($password, $user['contraseña'])) {
        
            if (password_needs_rehash($user['contraseña'], PASSWORD_DEFAULT)) {
                $this->actualizarHash($user['id_usuario'], $password);
            }
            return $user;
        }

        return false; 
    }

    public function registrar($nombre, $email, $password, $rol = 'alumno') {
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->pdo->prepare(
            "INSERT INTO usuarios (nombre, email, contraseña, rol, fecha_registro) 
             VALUES (?, ?, ?, ?, NOW())" 
        );
        return $stmt->execute([$nombre, $email, $hash, $rol]);
    }

    private function actualizarHash($id_usuario, $password){
        $nuevoHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->pdo->prepare("UPDATE usuarios SET contraseña = ? WHERE id_usuario = ?"); 
        $stmt->execute([$nuevoHash, $id_usuario]);
    }
}
?>
