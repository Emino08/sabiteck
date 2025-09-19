<?php

declare(strict_types=1);

namespace EmergencyResponse\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use EmergencyResponse\Services\CaseService;
use Respect\Validation\Validator as v;

class CaseController
{
    private CaseService $caseService;

    public function __construct(CaseService $caseService)
    {
        $this->caseService = $caseService;
    }

    public function createEmergency(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        // Validate input
        $validator = v::keySet(
            v::key('incident_type', v::in(['police', 'fire', 'medical', 'general'])),
            v::key('location', v::keySet(
                v::key('latitude', v::floatType()),
                v::key('longitude', v::floatType()),
                v::keyOptional('accuracy', v::floatType())
            )),
            v::keyOptional('title', v::stringType()),
            v::keyOptional('description', v::stringType()),
            v::keyOptional('anonymous', v::boolType()),
            v::keyOptional('device_id', v::stringType())
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Invalid input', 'details' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $caseData = array_merge($data, [
                'reporter_user_id' => $user ? $user->id : null
            ]);

            $case = $this->caseService->createEmergencyCase($caseData, $user ? $user->id : null);

            $response->getBody()->write(json_encode([
                'message' => 'Emergency case created successfully',
                'case' => $case
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getCase(Request $request, Response $response, array $args): Response
    {
        $caseId = (int) $args['caseId'];
        $user = $request->getAttribute('user');

        try {
            $case = $this->caseService->getCase($caseId, $user ? $user->id : null);

            $response->getBody()->write(json_encode($case));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getCases(Request $request, Response $response): Response
    {
        $user = $request->getAttribute('user');
        $queryParams = $request->getQueryParams();

        $page = (int) ($queryParams['page'] ?? 1);
        $limit = min((int) ($queryParams['limit'] ?? 20), 100);
        $status = $queryParams['status'] ?? null;
        $type = $queryParams['type'] ?? null;

        try {
            $cases = $this->caseService->getCases($user->id, $page, $limit, $status, $type);

            $response->getBody()->write(json_encode($cases));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    }

    public function assignResponder(Request $request, Response $response, array $args): Response
    {
        $caseId = (int) $args['caseId'];
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        if (empty($data['responder_id'])) {
            $response->getBody()->write(json_encode(['error' => 'responder_id is required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $success = $this->caseService->assignResponder($caseId, (int) $data['responder_id'], $user->id);

            if ($success) {
                $response->getBody()->write(json_encode(['message' => 'Responder assigned successfully']));
                return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
            } else {
                $response->getBody()->write(json_encode(['error' => 'Failed to assign responder']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function updateStatus(Request $request, Response $response, array $args): Response
    {
        $caseId = (int) $args['caseId'];
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        if (empty($data['status'])) {
            $response->getBody()->write(json_encode(['error' => 'status is required']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $success = $this->caseService->updateStatus(
                $caseId,
                $data['status'],
                $user->id,
                $data['notes'] ?? null
            );

            if ($success) {
                $response->getBody()->write(json_encode(['message' => 'Status updated successfully']));
                return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
            } else {
                $response->getBody()->write(json_encode(['error' => 'Failed to update status']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function verifyResponder(Request $request, Response $response, array $args): Response
    {
        $caseId = (int) $args['caseId'];
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        $validator = v::keySet(
            v::key('responder_id', v::intType()),
            v::key('method', v::in(['qr', 'code', 'manual'])),
            v::keyOptional('code', v::stringType()),
            v::keyOptional('qr_data', v::stringType()),
            v::keyOptional('location', v::keySet(
                v::key('latitude', v::floatType()),
                v::key('longitude', v::floatType())
            ))
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Invalid input', 'details' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $verificationData = array_merge($data, [
                'verified_by' => $user->id
            ]);

            $success = $this->caseService->verifyResponder(
                $caseId,
                (int) $data['responder_id'],
                $data['method'],
                $verificationData
            );

            if ($success) {
                $response->getBody()->write(json_encode(['message' => 'Responder verified successfully']));
                return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
            } else {
                $response->getBody()->write(json_encode(['error' => 'Failed to verify responder']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function cancelCase(Request $request, Response $response, array $args): Response
    {
        $caseId = (int) $args['caseId'];
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        try {
            $success = $this->caseService->updateStatus(
                $caseId,
                'cancelled',
                $user->id,
                $data['reason'] ?? 'Cancelled by user'
            );

            if ($success) {
                $response->getBody()->write(json_encode(['message' => 'Case cancelled successfully']));
                return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
            } else {
                $response->getBody()->write(json_encode(['error' => 'Failed to cancel case']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function getTimeline(Request $request, Response $response, array $args): Response
    {
        $caseId = (int) $args['caseId'];

        try {
            $timeline = $this->caseService->getTimeline($caseId);

            $response->getBody()->write(json_encode($timeline));
            return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
    }

    public function sendMessage(Request $request, Response $response, array $args): Response
    {
        $caseId = (int) $args['caseId'];
        $data = $request->getParsedBody();
        $user = $request->getAttribute('user');

        $validator = v::keySet(
            v::key('message', v::stringType()->notEmpty()),
            v::keyOptional('recipient_id', v::intType()),
            v::keyOptional('message_type', v::in(['text', 'location', 'media']))
        );

        try {
            $validator->assert($data);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(['error' => 'Invalid input', 'details' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        // TODO: Implement secure messaging
        $response->getBody()->write(json_encode(['message' => 'Message sent successfully']));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }

    public function getMessages(Request $request, Response $response, array $args): Response
    {
        $caseId = (int) $args['caseId'];
        $user = $request->getAttribute('user');

        // TODO: Implement secure messaging retrieval
        $response->getBody()->write(json_encode(['messages' => []]));
        return $response->withStatus(200)->withHeader('Content-Type', 'application/json');
    }
}