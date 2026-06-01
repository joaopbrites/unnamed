from django.utils import timezone
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase
from rest_framework import status
from apps.events.models import Event
from apps.comments.models import Comment, CommentReaction

User = get_user_model()


class CommentViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Festival",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=3),
            location="Local",
            created_by=self.admin,
        )
        self.ct = ContentType.objects.get_for_model(Event)
        self.comment = Comment.objects.create(
            author=self.member,
            content_type=self.ct,
            object_id=self.event.pk,
            text="Comentário existente",
        )

    # --- Leitura pública com filtro ---
    def test_list_comments_is_public(self):
        response = self.client.get(
            f"/api/comments/?content_type=events.event&object_id={self.event.pk}"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_comments_returns_only_filtered(self):
        response = self.client.get(
            f"/api/comments/?content_type=events.event&object_id={self.event.pk}"
        )
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["text"], "Comentário existente")

    def test_list_returns_only_root_comments(self):
        Comment.objects.create(
            author=self.member,
            content_type=self.ct,
            object_id=self.event.pk,
            text="Resposta",
            parent=self.comment,
        )
        response = self.client.get(
            f"/api/comments/?content_type=events.event&object_id={self.event.pk}"
        )
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["text"], "Comentário existente")

    def test_list_includes_reaction_counts(self):
        CommentReaction.objects.create(
            author=self.admin, comment=self.comment, reaction_type="like"
        )
        response = self.client.get(
            f"/api/comments/?content_type=events.event&object_id={self.event.pk}"
        )
        result = response.data["results"][0]
        self.assertIn("likes_count", result)
        self.assertIn("dislikes_count", result)
        self.assertEqual(result["likes_count"], 1)
        self.assertEqual(result["dislikes_count"], 0)

    def test_list_includes_replies_count(self):
        Comment.objects.create(
            author=self.admin,
            content_type=self.ct,
            object_id=self.event.pk,
            text="Resposta",
            parent=self.comment,
        )
        response = self.client.get(
            f"/api/comments/?content_type=events.event&object_id={self.event.pk}"
        )
        result = response.data["results"][0]
        self.assertIn("replies_count", result)
        self.assertEqual(result["replies_count"], 1)

    def test_list_includes_user_reaction_when_authenticated(self):
        self.client.force_authenticate(user=self.member)
        CommentReaction.objects.create(
            author=self.member, comment=self.comment, reaction_type="like"
        )
        response = self.client.get(
            f"/api/comments/?content_type=events.event&object_id={self.event.pk}"
        )
        result = response.data["results"][0]
        self.assertEqual(result["user_reaction"], "like")

    def test_list_user_reaction_none_when_anonymous(self):
        response = self.client.get(
            f"/api/comments/?content_type=events.event&object_id={self.event.pk}"
        )
        result = response.data["results"][0]
        self.assertIsNone(result["user_reaction"])

    # --- Criação ---
    def test_create_comment_unauthenticated_returns_401(self):
        data = {
            "content_type": "events.event",
            "object_id": self.event.pk,
            "text": "Novo comentário",
        }
        response = self.client.post("/api/comments/", data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_comment_authenticated_returns_201(self):
        self.client.force_authenticate(user=self.member)
        data = {
            "content_type": "events.event",
            "object_id": self.event.pk,
            "text": "Vou participar!",
        }
        response = self.client.post("/api/comments/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["text"], "Vou participar!")

    def test_create_comment_sets_author_from_token(self):
        self.client.force_authenticate(user=self.member)
        data = {
            "content_type": "events.event",
            "object_id": self.event.pk,
            "text": "Autor automático",
        }
        self.client.post("/api/comments/", data)
        comment = Comment.objects.get(text="Autor automático")
        self.assertEqual(comment.author, self.member)

    def test_create_reply_with_parent(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "content_type": "events.event",
            "object_id": self.event.pk,
            "text": "Resposta ao comentário",
            "parent": self.comment.pk,
        }
        response = self.client.post("/api/comments/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        reply = Comment.objects.get(text="Resposta ao comentário")
        self.assertEqual(reply.parent, self.comment)

    def test_invalid_content_type_returns_400(self):
        self.client.force_authenticate(user=self.member)
        data = {
            "content_type": "invalid.model",
            "object_id": 1,
            "text": "Texto",
        }
        response = self.client.post("/api/comments/", data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- Deleção ---
    def test_delete_own_comment_returns_204(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.delete(f"/api/comments/{self.comment.pk}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_other_users_comment_returns_403(self):
        other = User.objects.create_user(username="outro", password="senha123")
        self.client.force_authenticate(user=other)
        response = self.client.delete(f"/api/comments/{self.comment.pk}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_delete_any_comment(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.delete(f"/api/comments/{self.comment.pk}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class CommentRepliesTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=3),
            location="Local",
            created_by=self.admin,
        )
        self.ct = ContentType.objects.get_for_model(Event)
        self.root = Comment.objects.create(
            author=self.admin,
            content_type=self.ct,
            object_id=self.event.pk,
            text="Raiz",
        )
        self.reply = Comment.objects.create(
            author=self.member,
            content_type=self.ct,
            object_id=self.event.pk,
            text="Resposta",
            parent=self.root,
        )

    def test_replies_endpoint_returns_children(self):
        response = self.client.get(f"/api/comments/{self.root.pk}/replies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["text"], "Resposta")

    def test_replies_endpoint_is_public(self):
        response = self.client.get(f"/api/comments/{self.root.pk}/replies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_replies_on_comment_without_replies_returns_empty(self):
        response = self.client.get(f"/api/comments/{self.reply.pk}/replies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)


class CommentReactTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=3),
            location="Local",
            created_by=self.admin,
        )
        self.ct = ContentType.objects.get_for_model(Event)
        self.comment = Comment.objects.create(
            author=self.admin,
            content_type=self.ct,
            object_id=self.event.pk,
            text="Comentário",
        )

    def test_react_like_creates_reaction(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            f"/api/comments/{self.comment.pk}/react/",
            {"reaction_type": "like"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            CommentReaction.objects.filter(
                author=self.member, comment=self.comment, reaction_type="like"
            ).exists()
        )

    def test_react_dislike_creates_reaction(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            f"/api/comments/{self.comment.pk}/react/",
            {"reaction_type": "dislike"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_react_toggles_same_reaction_off(self):
        self.client.force_authenticate(user=self.member)
        CommentReaction.objects.create(
            author=self.member, comment=self.comment, reaction_type="like"
        )
        response = self.client.post(
            f"/api/comments/{self.comment.pk}/react/",
            {"reaction_type": "like"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(
            CommentReaction.objects.filter(author=self.member, comment=self.comment).exists()
        )

    def test_react_changes_existing_reaction(self):
        self.client.force_authenticate(user=self.member)
        CommentReaction.objects.create(
            author=self.member, comment=self.comment, reaction_type="like"
        )
        response = self.client.post(
            f"/api/comments/{self.comment.pk}/react/",
            {"reaction_type": "dislike"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reaction = CommentReaction.objects.get(author=self.member, comment=self.comment)
        self.assertEqual(reaction.reaction_type, "dislike")

    def test_react_requires_auth(self):
        response = self.client.post(
            f"/api/comments/{self.comment.pk}/react/",
            {"reaction_type": "like"},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_react_invalid_type_returns_400(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(
            f"/api/comments/{self.comment.pk}/react/",
            {"reaction_type": "love"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class CommentReportTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username="admin", email="admin@test.com", password="admin123"
        )
        self.member = User.objects.create_user(
            username="membro", email="membro@test.com", password="senha123"
        )
        self.event = Event.objects.create(
            title="Evento",
            description="desc",
            date=timezone.now() + timezone.timedelta(days=3),
            location="Local",
            created_by=self.admin,
        )
        self.ct = ContentType.objects.get_for_model(Event)
        self.comment = Comment.objects.create(
            author=self.admin,
            content_type=self.ct,
            object_id=self.event.pk,
            text="Comentário",
        )

    def test_report_sets_is_reported_flag(self):
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f"/api/comments/{self.comment.pk}/report/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.comment.refresh_from_db()
        self.assertTrue(self.comment.is_reported)

    def test_report_requires_auth(self):
        response = self.client.post(f"/api/comments/{self.comment.pk}/report/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_report_already_reported_returns_200(self):
        self.comment.is_reported = True
        self.comment.save()
        self.client.force_authenticate(user=self.member)
        response = self.client.post(f"/api/comments/{self.comment.pk}/report/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
