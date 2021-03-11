import { Component, OnInit, Input, ViewChild, Output, EventEmitter, AfterViewInit, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { CarouselComponent } from 'ngx-bootstrap/carousel';
import { QumlLibraryService } from '../quml-library.service';
import { QumlPlayerConfig } from '../quml-library-interface';
import { ViewerService } from '../services/viewer-service/viewer-service';
import { eventName, TelemetryType, pageId } from '../telemetry-constants';
import { UtilService } from '../util-service';



@Component({
  selector: 'quml-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.scss']
})
export class PlayerComponent implements OnInit, AfterViewInit {
  @Input() QumlPlayerConfig: QumlPlayerConfig;
  @Output() playerEvent = new EventEmitter<any>();
  @Output() telemetryEvent = new EventEmitter<any>();
  @ViewChild('car') car: CarouselComponent;


  questions: any;
  linearNavigation: boolean;
  endPageReached: boolean;
  slideInterval: number;
  showIndicator: Boolean;
  noWrapSlides: Boolean;
  optionSelectedObj: any;
  showAlert: Boolean;
  currentOptions: any;
  currentQuestion: any;
  media: any;
  currentSolutions: any;
  showSolution: any;
  active = false;
  alertType: string;
  previousOption: any;
  timeLimit: any;
  showTimer: any;
  showFeedBack: boolean;
  showUserSolution: boolean;
  startPageInstruction: string;
  shuffleQuestions: boolean;
  requiresSubmit: boolean;
  noOfQuestions: number;
  maxScore: number;
  points: number;
  initialTime: number;
  initializeTimer: boolean;
  durationSpent: string;
  userName: string;
  contentName: string;
  currentSlideIndex = 0;
  attemptedQuestions = [];
  loadScoreBoard = false;
  totalScore = [];
  private intervalRef: any;
  public finalScore = 0;
  progressBarClass = [];
  currentScore
  maxQuestions: number;
  allowSkip: boolean;
  infoPopup: boolean;
  CarouselConfig = {
    NEXT: 1,
    PREV: 2
  };
  sideMenuConfig = {
    showShare: true,
    showDownload: true,
    showReplay: false,
    showExit: true,
  };
  warningTime: number;

  constructor(
    public qumlLibraryService: QumlLibraryService,
    public viewerService: ViewerService,
    public utilService: UtilService
  ) {
    this.endPageReached = false;
    this.viewerService.qumlPlayerEvent.asObservable().subscribe((res) => {
      this.playerEvent.emit(res);
    });
  }

  @HostListener('document:TelemetryEvent', ['$event'])
  onTelemetryEvent(event) {
    this.telemetryEvent.emit(event.detail);
  }

  ngOnInit() {
    this.qumlLibraryService.initializeTelemetry(this.QumlPlayerConfig);
    this.viewerService.initialize(this.QumlPlayerConfig);

    this.initialTime = new Date().getTime();
    this.slideInterval = 0;
    this.showIndicator = false;
    this.noWrapSlides = true;
    this.questions = this.QumlPlayerConfig.data.children;
    this.timeLimit = this.QumlPlayerConfig.data.timeLimits && this.QumlPlayerConfig.data.timeLimits.totalTime ?
      this.QumlPlayerConfig.data.timeLimits.totalTime : (this.questions.length * 350);
    this.warningTime = this.QumlPlayerConfig.data.timeLimits && this.QumlPlayerConfig.data.timeLimits.warningTime ? this.QumlPlayerConfig.data.timeLimits.warningTime : 0;
    this.showTimer = this.QumlPlayerConfig.data.showTimer;
    this.showFeedBack = this.QumlPlayerConfig.data.showFeedback;
    this.showUserSolution = this.QumlPlayerConfig.data.showSolutions;
    this.startPageInstruction = this.QumlPlayerConfig.metadata.instructions;
    this.linearNavigation = this.QumlPlayerConfig.data.navigationMode === 'non-linear' ? false : true;
    this.requiresSubmit = this.QumlPlayerConfig.data.requiresSubmit;
    this.noOfQuestions = this.QumlPlayerConfig.data.totalQuestions;
    this.maxScore = this.QumlPlayerConfig.data.maxScore;
    this.points = this.QumlPlayerConfig.data.points;
    this.userName = this.QumlPlayerConfig.context.userData.firstName + ' ' + this.QumlPlayerConfig.context.userData.lastName;
    this.contentName = this.QumlPlayerConfig.data.name;
    this.shuffleQuestions = this.QumlPlayerConfig.data.shuffle;
    this.maxQuestions = this.QumlPlayerConfig.data.maxQuestions;
    this.allowSkip = !this.QumlPlayerConfig.data.allowSkip ? this.QumlPlayerConfig.data.allowSkip: true;
    if (this.shuffleQuestions) {
      this.questions = this.QumlPlayerConfig.data.children.sort(() => Math.random() - 0.5);
    }
    if (this.maxQuestions) {
      this.questions = this.questions.slice(0, this.maxQuestions);
    }
    if (!this.startPageInstruction) {
      this.initializeTimer = true;
    }
    this.viewerService.raiseStartEvent(this.car.getCurrentSlideIndex());
    this.setInitialScores();
  }

  ngAfterViewInit() {
    this.viewerService.raiseHeartBeatEvent(eventName.startPageLoaded, TelemetryType.impression, pageId.startPage);
  }

  nextSlide() {
    this.viewerService.raiseHeartBeatEvent(eventName.nextClicked, TelemetryType.interact, this.currentSlideIndex);
    if (this.loadScoreBoard) {
      this.endPageReached = true;
    }
    if (this.currentSlideIndex !== this.questions.length) {
      this.currentSlideIndex = this.currentSlideIndex + 1;
    }
    if (this.currentSlideIndex === 1 && (this.currentSlideIndex - 1) === 0 && this.startPageInstruction) {
      this.initializeTimer = true;
    }
    if (this.car.getCurrentSlideIndex() === this.questions.length && this.startPageInstruction) {
      const spentTime = (new Date().getTime() - this.initialTime) / 10000;
      this.durationSpent = spentTime.toFixed(2);
      if (!this.requiresSubmit) {
        this.endPageReached = true;
        this.viewerService.raiseEndEvent(this.currentSlideIndex, this.attemptedQuestions.length, this.endPageReached);
      } else {
        this.loadScoreBoard = true;
      }
    }
    if (this.car.getCurrentSlideIndex() + 1 === this.questions.length && !this.startPageInstruction) {
      const spentTime = (new Date().getTime() - this.initialTime) / 10000;
      this.durationSpent = spentTime.toFixed(2);
      if (!this.requiresSubmit) {
        this.endPageReached = true;
        this.viewerService.raiseEndEvent(this.currentSlideIndex, this.attemptedQuestions.length, this.endPageReached);
      } else {
        this.loadScoreBoard = true;
      }
    }
    if (this.car.isLast(this.car.getCurrentSlideIndex())) {
      this.calculateScore();
    }
  
    this.car.move(this.CarouselConfig.NEXT);
    this.active = false;
    this.showAlert = false;
    this.optionSelectedObj = undefined;
    this.currentQuestion = undefined;
    this.currentOptions = undefined;
    this.currentSolutions = undefined;
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
  }

  prevSlide() {
    this.viewerService.raiseHeartBeatEvent(eventName.prevClicked, TelemetryType.interact, this.car.getCurrentSlideIndex());
    this.showAlert = false;
    if (this.car.getCurrentSlideIndex() + 1 === this.questions.length && this.endPageReached) {
      this.endPageReached = false;
    } else if (!this.loadScoreBoard) {
      this.car.move(this.CarouselConfig.PREV);
    } else if (!this.linearNavigation && this.loadScoreBoard) {
      const index = this.startPageInstruction ? this.questions.length : this.questions.length - 1;
      this.car.selectSlide(index);
      this.loadScoreBoard = false;
    }
  }

  sideBarEvents(event) {
    this.viewerService.raiseHeartBeatEvent(event, TelemetryType.interact, this.car.getCurrentSlideIndex());
  }


  getOptionSelected(optionSelected) {
    this.active = true;
    const currentIndex = this.startPageInstruction ? this.car.getCurrentSlideIndex() - 1 : this.car.getCurrentSlideIndex();
    this.viewerService.raiseHeartBeatEvent(eventName.optionClicked, TelemetryType.interact, this.car.getCurrentSlideIndex());
    this.optionSelectedObj = optionSelected;
    this.currentSolutions = optionSelected.solutions;
    this.media = this.questions[currentIndex].media;
    if (this.currentSolutions) {
      this.currentSolutions.forEach((ele, index) => {
        if (ele.type === 'video') {
          this.media.forEach((e) => {
            if (e.id === this.currentSolutions[index].value) {
              this.currentSolutions[index].type = 'video'
              this.currentSolutions[index].src = e.src;
              this.currentSolutions[index].thumbnail = e.thumbnail;
            }
          })
        }
      })
    }
  }

  closeAlertBox(event) {
    if (event.type === 'close') {
      this.viewerService.raiseHeartBeatEvent(eventName.closedFeedBack, TelemetryType.interact, this.car.getCurrentSlideIndex());
    } else if (event.type === 'tryAgain') {
      this.viewerService.raiseHeartBeatEvent(eventName.tryAgain, TelemetryType.interact, this.car.getCurrentSlideIndex());
    }
    this.showAlert = false;
  }

  viewSolution() {
    this.viewerService.raiseHeartBeatEvent(eventName.viewSolutionClicked, TelemetryType.interact, this.car.getCurrentSlideIndex());
    this.showSolution = true;
    this.showAlert = false;
    clearTimeout(this.intervalRef);
  }

  exitContent(event) {
    if (event.type === 'EXIT') {
      this.viewerService.raiseHeartBeatEvent(eventName.endPageExitClicked, TelemetryType.interact, 'endPage')
      this.viewerService.raiseEndEvent(this.currentSlideIndex, this.currentSlideIndex - 1, 'endPage');
    }
  }

  closeSolution() {
    this.viewerService.raiseHeartBeatEvent(eventName.solutionClosed, TelemetryType.interact, this.car.getCurrentSlideIndex());
    this.showSolution = false;
    this.car.selectSlide(this.currentSlideIndex);
  }

  async validateSelectedOption(option) {
    const selectedOptionValue = option ? option.option.value : undefined;
    const currentIndex = this.startPageInstruction ? this.car.getCurrentSlideIndex() - 1 : this.car.getCurrentSlideIndex();
    let updated = false;
    if (this.optionSelectedObj !== undefined) {
      let key: any = this.utilService.getKeyValue(Object.keys(this.questions[currentIndex].responseDeclaration));
      this.currentQuestion = this.questions[currentIndex].body;
      this.currentOptions = this.questions[currentIndex].interactions[key].options;
      if (option.cardinality === 'single') {
        const correctOptionValue = this.questions[currentIndex].responseDeclaration[key].correctResponse.value;
        if (Boolean(option.option.value == correctOptionValue)) {
          this.currentScore = this.getScore(currentIndex, key);
          this.viewerService.raiseAssesEvent(this.currentQuestion , currentIndex , 'Yes' , this.currentScore , option.option , new Date().getTime());
          this.showAlert = true;
          this.alertType = 'correct';
          this.updateScoreBoard(currentIndex + 1, 'attempted', selectedOptionValue, this.currentScore);
          if (!this.showFeedBack) {
            this.nextSlide();
          }
          if (this.showFeedBack) {
            this.correctFeedBackTimeOut();
            this.updateScoreBoard(((currentIndex + 1)), 'correct', undefined, this.currentScore);
          }
        } else if (!Boolean(option.option.value.value == correctOptionValue)) {
          this.currentScore = this.getScore(currentIndex, key);
          this.viewerService.raiseAssesEvent(this.currentQuestion , currentIndex , 'No' , this.currentScore , option.option , new Date().getTime());
          this.showAlert = true;
          this.alertType = 'wrong';
          if (this.showFeedBack) {
            this.updateScoreBoard((currentIndex + 1), 'wrong');
          }
          if (!this.showFeedBack) {
            this.nextSlide();
          }
        }
      }
      if (option.cardinality === 'multiple') {
        let key: any = this.utilService.getKeyValue(Object.keys(this.questions[currentIndex].responseDeclaration));
        const responseDeclaration = this.questions[currentIndex].responseDeclaration;
        this.currentScore = this.utilService.getMultiselectScore(option.option, responseDeclaration);
        if (this.currentScore > 0) {
          if (this.showFeedBack) {
            this.updateScoreBoard(((currentIndex + 1)), 'correct', undefined, this.currentScore);
            this.correctFeedBackTimeOut();
            this.showAlert = true;
            this.alertType = 'correct';
          } else if (!this.showFeedBack) {
            this.nextSlide();
          }
        } else if (this.currentScore === 0) {
          if (this.showFeedBack) {
            this.showAlert = true;
            this.alertType = 'wrong';
            this.updateScoreBoard((currentIndex + 1), 'wrong');
          } else if (!this.showFeedBack) {
            this.nextSlide();
          }
        }
      }
      this.optionSelectedObj = undefined;
    } else if (this.optionSelectedObj === undefined && this.allowSkip && this.utilService.getQuestionType(this.questions, currentIndex) === 'MCQ') {
      this.nextSlide();
    } else if (this.utilService.getQuestionType(this.questions, currentIndex) === 'SA' || this.startPageInstruction && this.car.getCurrentSlideIndex() === 0) {
      this.nextSlide();
    } else if (this.startPageInstruction && this.optionSelectedObj === undefined && !this.active && !this.allowSkip && this.car.getCurrentSlideIndex() > 0 && this.utilService.getQuestionType(this.questions, currentIndex) === 'MCQ'
      && !this.loadScoreBoard && this.utilService.canGo(this.progressBarClass[this.car.getCurrentSlideIndex()])) {
      this.infopopupTimeOut();
    } else if (this.optionSelectedObj === undefined && !this.active && !this.allowSkip && this.car.getCurrentSlideIndex() >= 0 && this.utilService.getQuestionType(this.questions, currentIndex) === 'MCQ'
      && !this.loadScoreBoard && this.utilService.canGo(this.progressBarClass[this.car.getCurrentSlideIndex()])) {
      this.infopopupTimeOut();
    } else if (!this.optionSelectedObj && this.active) {
      this.nextSlide();
    }
  }


  infopopupTimeOut() {
    this.infoPopup = true;
    setTimeout(() => {
      this.infoPopup = false;
    }, 2000)
  }

  updateScoreBoard(index, classToBeUpdated, optionValue?, score?) {
    if (this.showFeedBack) {
      this.progressBarClass.forEach((ele) => {
        if (ele.index === index) {
          ele.class = classToBeUpdated;
          ele.score = score ? score : 0
          ele.qType = this.questions[index - 1].primaryCategory.toLowerCase() === 'multiple choice question' ? 'MCQ' : 'SA';
        }
      })
    } else if (!this.showFeedBack) {
      this.progressBarClass.forEach((ele) => {
        if (ele.index === index) {
          ele.class = classToBeUpdated;
          ele.score = score ? score : 0;
          ele.value = optionValue
        }
      })
    }
  }

  calculateScore() {
    this.finalScore = 0;
    this.progressBarClass.forEach((ele) => {
      this.finalScore = this.finalScore + ele.score;
    })
  }

  scoreBoardLoaded(event) {
    if (event.scoreBoardLoaded) {
      this.calculateScore();
    }
  }

  correctFeedBackTimeOut() {
    this.intervalRef = setTimeout(() => {
      this.showAlert = false;
      if (!this.car.isLast(this.car.getCurrentSlideIndex())) {
        this.nextSlide();
      } else if (this.car.isLast(this.car.getCurrentSlideIndex())) {
        this.endPageReached = true;
        this.calculateScore();
      }
    }, 3000)
  }

  nextSlideClicked(event) {
    if (event.type === 'next') {
      this.validateSelectedOption(this.optionSelectedObj);
    }
  }

  previousSlideClicked(event) {
    if (event = 'previous clicked') {
      this.prevSlide();
    }
  }

  replayContent() {
    this.viewerService.raiseHeartBeatEvent(eventName.replayClicked, TelemetryType.interact, this.car.getCurrentSlideIndex());
    this.viewerService.raiseStartEvent(this.car.getCurrentSlideIndex());
    this.endPageReached = false;
    this.loadScoreBoard = false;
    const index = this.startPageInstruction ? 1 : 0;
    console.log(index);
    this.car.selectSlide(index);
  }

  inScoreBoardSubmitClicked() {
    this.viewerService.raiseHeartBeatEvent(eventName.scoreBoardSubmitClicked, TelemetryType.interact, pageId.submitPage);
    this.endPageReached = true;
  }

  goToSlide(index) {
    if (index === 0) {
      this.optionSelectedObj = undefined;
    }
    if (this.loadScoreBoard) {
      this.loadScoreBoard = false;
    }
    if (!this.allowSkip && this.utilService.canGo(this.progressBarClass[(index-1)]['class'])) {
      this.car.selectSlide(index);
    } else if(this.allowSkip) {
      this.car.selectSlide(index);
    }
  }

  setInitialScores() {
    if (this.showFeedBack) {
      this.questions.forEach((ele, index) => {
        this.progressBarClass.push({
          index: (index + 1), class: 'skipped',
          score: 0,
          qType: this.questions[index].primaryCategory.toLowerCase() === 'multiple choice question' ? 'MCQ' : 'SA'
        });
      })
    } else if (!this.showFeedBack) {
      this.questions.forEach((ele, index) => {
        this.progressBarClass.push({
          index: (index + 1), class: 'unattempted', value: undefined,
          score: 0,
          qType: this.questions[index].primaryCategory.toLowerCase() === 'multiple choice question' ? 'MCQ' : 'SA'
        });
      })
    }
  }

  goToQuestion(event) {
    const index = this.startPageInstruction ? event.questionNo : event.questionNo - 1;
    this.car.selectSlide(index);
    this.loadScoreBoard = false;
  }

  getSolutions() {
    const currentIndex = this.car.getCurrentSlideIndex();
    this.currentQuestion = this.questions[currentIndex].body;
    this.currentOptions = this.questions[currentIndex].interactions.response1.options;
    if (this.currentSolutions) {
      this.showSolution = true;
    }
    if (this.intervalRef) {
      clearInterval(this.intervalRef)
    }
  }

  getScore(currentIndex, key) {
    return this.questions[currentIndex].responseDeclaration.maxScore ? this.questions[currentIndex].responseDeclaration.maxScore : this.questions[currentIndex].responseDeclaration[key].correctResponse.outcomes;
  }
}
