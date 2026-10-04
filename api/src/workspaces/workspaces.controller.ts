import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

<<<<<<< HEAD
  

=======
>>>>>>> 62b1a02fa6b759d4f86ed0b7d9cff5c13c3cc355
  @Get()
  findAll() {
    return this.workspacesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(Number(id));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string },
  ) {
    return this.workspacesService.update(Number(id), body);
  }
<<<<<<< HEAD

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug:string){
    return this.workspacesService.findBySlug(slug);
  }
  


}
=======
}
>>>>>>> 62b1a02fa6b759d4f86ed0b7d9cff5c13c3cc355
