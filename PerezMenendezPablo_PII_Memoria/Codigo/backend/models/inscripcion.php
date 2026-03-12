<?php
class Inscripcion {
    private $pdo;

    public function __construct($pdo){
        $this->pdo = $pdo;
    }

    public function inscribir($id_usuario, $id_curso){
        $stmt = $this->pdo->prepare("SELECT * FROM inscripciones WHERE id_usuario=? AND id_curso=?"); 
        $stmt->execute([$id_usuario, $id_curso]);
        if($stmt->fetch()){
            $stmt = $this->pdo->prepare("UPDATE inscripciones SET estado='activo' WHERE id_usuario=? AND id_curso=?"); 
            return $stmt->execute([$id_usuario, $id_curso]);
        }
        $stmt = $this->pdo->prepare("INSERT INTO inscripciones(id_usuario,id_curso,estado) VALUES(?,?, 'activo')"); 
        return $stmt->execute([$id_usuario,$id_curso]);
    }

    public function darseBaja($id_usuario, $id_curso){
        $stmt = $this->pdo->prepare("UPDATE inscripciones SET estado='baja' WHERE id_usuario=? AND id_curso=?"); 
        return $stmt->execute([$id_usuario,$id_curso]);
    }

    public function darseBajaAdmin($id_inscripcion){
        $stmt = $this->pdo->prepare("UPDATE inscripciones SET estado='baja' WHERE id_inscripcion=?");
        return $stmt->execute([$id_inscripcion]);
    }

    public function listarInscripciones($id_usuario){
        $stmt = $this->pdo->prepare(
            "SELECT i.id_inscripcion, i.id_curso, c.titulo, c.descripcion, c.fecha_inicio, c.fecha_fin, i.estado 
             FROM inscripciones i 
             JOIN cursos c ON i.id_curso=c.id_curso 
             WHERE i.id_usuario=?" 
        );
        $stmt->execute([$id_usuario]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listarTodasInscripciones($filtro = '', $estado = 'todos'){
        $sql = "SELECT i.id_inscripcion, u.nombre, c.titulo, i.estado, c.fecha_inicio, c.fecha_fin
                FROM inscripciones i
                JOIN usuarios u ON i.id_usuario = u.id_usuario
                JOIN cursos c ON i.id_curso = c.id_curso
                WHERE 1=1"; 
        $params = [];
        if($filtro !== ''){
            $sql .= " AND u.nombre LIKE ?";
            $params[] = "%$filtro%";
        }
        if($estado !== 'todos'){
            $sql .= " AND i.estado=?";
            $params[] = $estado;
        }
        $sql .= " ORDER BY c.fecha_inicio DESC";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
