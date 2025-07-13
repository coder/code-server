PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE `migrations`(`id` text,PRIMARY KEY(`id`));
INSERT INTO migrations VALUES('202505141324');
CREATE TABLE IF NOT EXISTS "users"(
  `id` integer,
  `created_at` datetime,
  `updated_at` datetime,
  `deleted_at` datetime,
  `name` text UNIQUE,
  `display_name` text,
  `email` text,
  `provider_identifier` text,
  `provider` text,
  `profile_pic_url` text,
  PRIMARY KEY(`id`)
);
INSERT INTO users VALUES(1,'2024-09-27 14:26:08.573622915+00:00','2024-09-27 14:26:08.573622915+00:00',NULL,'user2',NULL,NULL,NULL,NULL,NULL);
INSERT INTO users VALUES(2,'2024-09-27 14:26:17.094350688+00:00','2024-09-27 14:26:17.094350688+00:00',NULL,'user1',NULL,NULL,NULL,NULL,NULL);
CREATE TABLE IF NOT EXISTS "pre_auth_keys"(
  `id` integer,
  `key` text,
  `user_id` integer,
  `reusable` numeric,
  `ephemeral` numeric DEFAULT false,
  `used` numeric DEFAULT false,
  `tags` text,
  `created_at` datetime,
  `expiration` datetime,
  PRIMARY KEY(`id`),
  CONSTRAINT `fk_pre_auth_keys_user` FOREIGN KEY(`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
INSERT INTO pre_auth_keys VALUES(1,'3d133ec953e31fd41edbd935371234f762b4bae300cea618',1,1,0,1,NULL,'2024-09-27 14:26:14.737869796+00:00','2024-09-28 14:26:14.736601748+00:00');
INSERT INTO pre_auth_keys VALUES(2,'9813cc1df1832259fb6322dad788bb9bec89d8a01eef683a',2,1,0,1,NULL,'2024-09-27 14:26:23.181049239+00:00','2024-09-28 14:26:23.179903567+00:00');
CREATE TABLE IF NOT EXISTS "routes"(
  `id` integer,
  `created_at` datetime,
  `updated_at` datetime,
  `deleted_at` datetime,
  `node_id` integer NOT NULL,
  `prefix` text,
  `advertised` numeric,
  `enabled` numeric,
  `is_primary` numeric,
  PRIMARY KEY(`id`),
  CONSTRAINT `fk_nodes_routes` FOREIGN KEY(`node_id`) REFERENCES `nodes`(`id`) ON DELETE CASCADE
);
INSERT INTO routes VALUES(1,'2025-06-18 10:00:00','2025-06-18 10:00:00',NULL,1,'0.0.0.0/0',1,1,0);
INSERT INTO routes VALUES(2,'2025-06-18 10:00:00','2025-06-18 10:00:00',NULL,1,'::/0',1,1,0);
INSERT INTO routes VALUES(3,'2025-06-18 10:00:00','2025-06-18 10:00:00',NULL,2,'192.168.100.0/24',1,1,1);
INSERT INTO routes VALUES(4,'2025-06-18 10:00:00','2025-06-18 10:00:00',NULL,3,'10.0.0.0/8',1,0,0);
CREATE TABLE IF NOT EXISTS "api_keys"(
  `id` integer,
  `prefix` text UNIQUE,
  `hash` blob,
  `created_at` datetime,
  `expiration` datetime,
  `last_seen` datetime,
  PRIMARY KEY(`id`)
);
INSERT INTO api_keys VALUES(1,'ak_test',X'deadbeef','2025-12-31 23:59:59','2025-06-18 12:00:00','2025-06-18 10:00:00');
CREATE TABLE IF NOT EXISTS "nodes"(
  `id` integer,
  `machine_key` text,
  `node_key` text,
  `disco_key` text,
  `endpoints` text,
  `host_info` text,
  `ipv4` text,
  `ipv6` text,
  `hostname` text,
  `given_name` varchar(63),
  `user_id` integer,
  `register_method` text,
  `forced_tags` text,
  `auth_key_id` integer,
  `last_seen` datetime,
  `expiry` datetime,
  `created_at` datetime,
  `updated_at` datetime,
  `deleted_at` datetime,
  PRIMARY KEY(`id`),
  CONSTRAINT `fk_nodes_user` FOREIGN KEY(`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nodes_auth_key` FOREIGN KEY(`auth_key_id`) REFERENCES `pre_auth_keys`(`id`) ON DELETE SET NULL
);
INSERT INTO nodes VALUES(1,'mkey:1efe4388236c1c83fe0a19d3ce7c321ab81e138a4da57917c231ce4c01944409','nodekey:4091de8ee569b46a0cf322ae7350e80f3af4ccfd6d83a27ad4ce455982bd0f52','discokey:0ec0a701b7596a230fff993483c12019951899920fbc1eefa90f73f05147ea20','["192.168.1.100:41641"]','{"OS":"linux"}','100.64.0.1','fd7a:115c:a1e0::1','node1','node1',1,'authkey',NULL,NULL,NULL,NULL,'2025-06-18 10:00:00','2025-06-18 10:00:00',NULL);
INSERT INTO nodes VALUES(2,'mkey:779766343bd0311dd043e61f4e5ab13b43dbd9fef3c243aad406aac43146f566','nodekey:ae80297e118d23f00e029c89c82c53cf575803c40e0dfab5bf3f34213b265731','discokey:591540881c8a783dcfeeb1dbe049ce9a9b74347b6a96c0f17452735cb1de6c2f','["192.168.1.101:41641"]','{"OS":"darwin"}','100.64.0.2','fd7a:115c:a1e0::2','node2','node2',1,'authkey',NULL,NULL,NULL,NULL,'2025-06-18 10:00:00','2025-06-18 10:00:00',NULL);
INSERT INTO nodes VALUES(3,'mkey:233ecd117c36c1e5a635b1658fd54369fddf38b5312adf8aae38dfe6506fdf47','nodekey:2a53f1bbefae24a4724201379a05d32c84fc8c86fb2c856334a904ac53a3b827','discokey:acda4e99407eed3b807b81649998d69f93e9c28ce6e4dc1032686b45a70bca09','["192.168.1.102:41641"]','{"OS":"windows"}','100.64.0.3','fd7a:115c:a1e0::3','node3','node3',2,'authkey',NULL,NULL,NULL,NULL,'2025-06-18 10:00:00','2025-06-18 10:00:00',NULL);
CREATE TABLE `policies`(
  `id` integer PRIMARY KEY AUTOINCREMENT,
  `created_at` datetime,
  `updated_at` datetime,
  `deleted_at` datetime,
  `data` text
);
DELETE FROM sqlite_sequence;
CREATE INDEX `idx_users_deleted_at` ON `users`(`deleted_at`);
CREATE INDEX `idx_routes_deleted_at` ON `routes`(`deleted_at`);
CREATE UNIQUE INDEX `idx_api_keys_prefix` ON `api_keys`(`prefix`);
CREATE INDEX `idx_policies_deleted_at` ON `policies`(`deleted_at`);
COMMIT;
