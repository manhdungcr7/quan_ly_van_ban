-- Tạo database
CREATE DATABASE IF NOT EXISTS `document_management`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `document_management`;

-- Tạo bảng categories
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng documents
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('incoming','outgoing') NOT NULL,
  `number` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `summary` text NOT NULL,
  `document_type` varchar(50) NOT NULL,
  `priority` enum('normal','urgent','very-urgent') DEFAULT 'normal',
  `status` enum('draft','processing','completed','overdue','sent') DEFAULT 'draft',
  `sender_department` varchar(255) DEFAULT NULL,
  `receiver_department` varchar(255) DEFAULT NULL,
  `main_responsible` varchar(255) DEFAULT NULL,
  `processing_deadline` date DEFAULT NULL,
  `signer` varchar(255) DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `attachment_name` varchar(255) DEFAULT NULL,
  `attachment_path` varchar(500) DEFAULT NULL,
  `attachment_size` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `number` (`number`),
  KEY `idx_type` (`type`),
  KEY `idx_date` (`date`),
  KEY `idx_status` (`status`),
  KEY `idx_number` (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng notifications
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','error','success') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `document_id` (`document_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng users
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu cho bảng documents (tùy chọn, có thể bỏ nếu muốn sạch)
INSERT INTO `documents` (`id`, `type`, `number`, `date`, `summary`, `document_type`, `priority`, `status`, `sender_department`, `receiver_department`, `main_responsible`, `processing_deadline`, `signer`, `tags`, `notes`, `attachment_name`, `attachment_path`, `attachment_size`, `created_at`, `updated_at`) VALUES
(2, 'incoming', 'CV002/2025', '2025-07-02', 'Thông báo về lịch họp định kỳ tháng 7', 'notification', 'normal', 'processing', 'Phòng Tổ chức', NULL, 'Trần Thị B', '2025-07-10', NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-15 10:22:47', '2025-07-15 10:22:47'),
(4, 'outgoing', '57/CV-K7', '2025-07-15', 'eeee', 'instruction', 'normal', 'draft', NULL, 'www', NULL, NULL, 'www', 'ssss', '', 'Báo cáo rà soát, đánh giá hệ thống phần mềm, hạ tầng CĐS (4).docx', 'vanban_files/vanbandi/Báo cáo rà soát, đánh giá hệ thống phần mềm, hạ tầng CĐS (4).docx', 25051, '2025-07-15 03:44:52', '2025-07-15 03:44:52'),
(10, 'outgoing', '124/cv-k7', '2025-07-18', 'jhjhj', 'report', 'normal', 'draft', NULL, 'P3', NULL, NULL, 'Lộc', '', '', 'Tin bài nghiệm thu Tập bài giảng.docx', 'vanban_files/vanbandi/Tin bài nghiệm thu Tập bài giảng.docx', 864147, '2025-07-17 23:12:38', '2025-07-17 23:12:38'),
(11, 'outgoing', 'hhhjhj', '2025-07-18', 'nnknkn', 'summary', 'normal', 'draft', NULL, 'nknknk', NULL, NULL, '', '', '', 'Đề xuất trưng dụng sv.docx', 'vanban_files/vanbandi/Đề xuất trưng dụng sv.docx', 22777, '2025-07-17 23:24:22', '2025-07-17 23:24:22'),
(19, 'incoming', '19', '2025-07-18', 'lklklklk', 'official', 'normal', 'draft', 'p3', NULL, 'Lộc', '2025-07-15', NULL, '', '', 'Thống kê điểm TTTN VB2-D2A, B Bình Dương.doc', 'vanban_files/vanbanden/1752822079_Thống kê điểm TTTN VB2-D2A, B Bình Dương.doc', 67072, '2025-07-18 00:01:19', '2025-07-18 00:01:19'),
(20, 'outgoing', '30', '2025-07-18', '2eftfr', 'report', 'normal', 'draft', NULL, 'P5', NULL, NULL, 'Trần Thị B', '', '', 'Đề xuất trưng dụng sv.docx', 'vanban_files/vanbandi/1752822410_Đề xuất trưng dụng sv.docx', 22777, '2025-07-18 00:06:50', '2025-07-18 00:06:50'),
(21, 'incoming', '32', '2025-07-18', 'yyt', 'agreement', 'normal', 'sent', '5', NULL, '', '2025-07-19', NULL, '', '', 'Đề xuất trưng dụng sv.pdf', 'vanban_files/vanbanden/1752822526_Đề xuất trưng dụng sv.pdf', 169686, '2025-07-18 00:08:46', '2025-07-18 00:10:07'),
(22, 'incoming', 'fgf', '2025-07-18', 'rereere', 'official', 'normal', 'draft', 'p3', NULL, 'df', '2025-07-19', NULL, '', '', NULL, NULL, NULL, '2025-07-18 00:17:59', '2025-07-18 00:17:59');
