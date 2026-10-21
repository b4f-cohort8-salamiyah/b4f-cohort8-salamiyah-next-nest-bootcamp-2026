import { ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Model } from 'mongoose';
import { CreateIssueDto } from './dto/create-issue.dto';
import { ProjectsService } from '../projects/projects.service';
import { IssueDocument } from './schemas/issue.schema';
import { IssuesService } from './issues.service';
import { WorkspaceMembersService } from '../workspace-members/workspace-members.service';

describe('IssuesService authorization', () => {
  let service: IssuesService;
  let model: {
    findOne: jest.Mock;
    insertOne: jest.Mock;
  };
  let projectsService: {
    findOne: jest.Mock;
  };
  let workspaceMembersService: {
    findByWorkspaceAndUser: jest.Mock;
  };

  const workspaceId = 31;
  const projectId = 41;

  function makeIssue(overrides: Partial<IssueDocument> = {}): IssueDocument {
    const save = jest.fn();
    const issue = {
      id: 51,
      projectId,
      reporterId: 61,
      assigneeId: 62,
      title: 'Test issue',
      description: '',
      status: 'todo',
      save,
      deleteOne: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    } as unknown as IssueDocument;

    save.mockImplementation(() => Promise.resolve(issue));
    return issue;
  }

  beforeEach(() => {
    model = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
    };
    projectsService = {
      findOne: jest.fn().mockResolvedValue({ id: projectId, workspaceId }),
    };
    workspaceMembersService = {
      findByWorkspaceAndUser: jest.fn(),
    };

    service = new IssuesService(
      model as unknown as Model<IssueDocument>,
      projectsService as unknown as ProjectsService,
      workspaceMembersService as unknown as WorkspaceMembersService,
    );
  });

  it('rejects an outsider creating an issue', async () => {
    workspaceMembersService.findByWorkspaceAndUser.mockResolvedValue(null);

    await expect(
      service.create({ projectId, title: 'Outsider issue' }, 70),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(model.insertOne).not.toHaveBeenCalled();
  });

  it('rejects a client-supplied reporterId through the app validation rules', async () => {
    const dto = plainToInstance(CreateIssueDto, {
      projectId,
      title: 'Client supplied reporter',
      reporterId: 76,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors.map(({ property }) => property)).toContain('reporterId');
  });

  it('sets the authenticated creator as reporter and validates the assignee', async () => {
    workspaceMembersService.findByWorkspaceAndUser.mockResolvedValue({
      role: 'member',
    });
    model.findOne.mockReturnValue({
      sort: jest.fn().mockResolvedValue(null),
    });
    model.insertOne.mockImplementation((issue) => Promise.resolve(issue));

    const created = await service.create(
      { projectId, title: 'Member issue', assigneeId: 72 },
      71,
    );

    expect(
      workspaceMembersService.findByWorkspaceAndUser,
    ).toHaveBeenNthCalledWith(1, workspaceId, 71);
    expect(
      workspaceMembersService.findByWorkspaceAndUser,
    ).toHaveBeenNthCalledWith(2, workspaceId, 72);
    expect(created).toMatchObject({
      projectId,
      reporterId: 71,
      assigneeId: 72,
    });
  });

  it('rejects assigning an issue to a non-member on creation', async () => {
    workspaceMembersService.findByWorkspaceAndUser
      .mockResolvedValueOnce({ role: 'member' })
      .mockResolvedValueOnce(null);

    await expect(
      service.create(
        { projectId, title: 'Invalid assignee', assigneeId: 73 },
        71,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(model.insertOne).not.toHaveBeenCalled();
  });

  it('rejects a workspace member unrelated to this issue from updating it', async () => {
    const issue = makeIssue();
    model.findOne.mockResolvedValue(issue);
    workspaceMembersService.findByWorkspaceAndUser.mockResolvedValue({
      role: 'member',
    });

    await expect(
      service.update(issue.id, { status: 'in_progress' }, 74),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(issue.save).not.toHaveBeenCalled();
    expect(model.findOne).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['reporter', 61],
    ['assignee', 62],
  ])('allows the issue %s to update it', async (_relationship, userId) => {
    const issue = makeIssue();
    model.findOne.mockResolvedValue(issue);

    await expect(
      service.update(issue.id, { status: 'in_progress' }, userId),
    ).resolves.toBe(issue);

    expect(
      workspaceMembersService.findByWorkspaceAndUser,
    ).not.toHaveBeenCalled();
    expect(issue.save).toHaveBeenCalled();
  });

  it.each([
    ['reporter', 61],
    ['assignee', 62],
  ])('allows the issue %s to delete it', async (_relationship, userId) => {
    const issue = makeIssue();
    model.findOne.mockResolvedValue(issue);

    await expect(service.remove(issue.id, userId)).resolves.toBe(issue);

    expect(issue.deleteOne).toHaveBeenCalledTimes(1);
    expect(
      workspaceMembersService.findByWorkspaceAndUser,
    ).not.toHaveBeenCalled();
  });

  it.each(['owner', 'admin'])(
    'allows a current workspace %s to update an unrelated issue',
    async (role) => {
      const issue = makeIssue();
      model.findOne.mockResolvedValue(issue);
      workspaceMembersService.findByWorkspaceAndUser.mockResolvedValue({
        role,
      });

      await expect(
        service.update(issue.id, { status: 'in_progress' }, 74),
      ).resolves.toBe(issue);
    },
  );

  it('rejects assigning an issue to a non-member on reassignment', async () => {
    const issue = makeIssue();
    model.findOne.mockResolvedValue(issue);
    workspaceMembersService.findByWorkspaceAndUser
      .mockResolvedValueOnce({ role: 'admin' })
      .mockResolvedValueOnce(null);

    await expect(
      service.update(issue.id, { assigneeId: 75 }, 74),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(issue.save).not.toHaveBeenCalled();
  });

  it('allows a valid workspace member to be assigned during reassignment', async () => {
    const issue = makeIssue();
    model.findOne.mockResolvedValue(issue);
    workspaceMembersService.findByWorkspaceAndUser.mockResolvedValue({
      role: 'member',
    });

    await expect(
      service.update(issue.id, { assigneeId: 77 }, 61),
    ).resolves.toBe(issue);

    expect(issue.assigneeId).toBe(77);
    expect(workspaceMembersService.findByWorkspaceAndUser).toHaveBeenCalledWith(
      workspaceId,
      77,
    );
  });

  it('allows the reporter to clear an issue assignee', async () => {
    const issue = makeIssue();
    model.findOne.mockResolvedValue(issue);

    await expect(
      service.update(issue.id, { assigneeId: null }, 61),
    ).resolves.toBe(issue);

    expect(issue.assigneeId).toBeNull();
    expect(
      workspaceMembersService.findByWorkspaceAndUser,
    ).not.toHaveBeenCalled();
  });

  it('allows only an issue owner or a current workspace Owner/Admin to delete it', async () => {
    const issue = makeIssue();
    model.findOne.mockResolvedValue(issue);
    workspaceMembersService.findByWorkspaceAndUser.mockResolvedValue({
      role: 'member',
    });

    await expect(service.remove(issue.id, 74)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(issue.deleteOne).not.toHaveBeenCalled();
    expect(model.findOne).toHaveBeenCalledTimes(1);

    workspaceMembersService.findByWorkspaceAndUser.mockResolvedValue({
      role: 'admin',
    });

    await expect(service.remove(issue.id, 74)).resolves.toBe(issue);
    expect(issue.deleteOne).toHaveBeenCalledTimes(1);
  });
});
